"use client";

import type { HolisticLandmarker } from "@mediapipe/tasks-vision";
import { RecordIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { Segmented } from "@/components/system/segmented";
import { createLandmarkLog, type LandmarkLog, type LandmarksFile } from "@/lib/sign-capture/landmarks";
import { cn } from "@/lib/utils";

import { SignReplay } from "./sign-replay-lazy";
import { quietButton, secondaryButton } from "./styles";

// The tracker runs on the signer's device (ADR 0014). Its runtime and model
// load from their public CDNs, pinned: the runtime version matches
// @mediapipe/tasks-vision in package.json.
const MEDIAPIPE_VERSION = "1.2.3";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task";
const TRACKER = `MediaPipe HolisticLandmarker float16/1 (tasks-vision ${MEDIAPIPE_VERSION})`;

// A take is a word or a sentence: a minute is plenty, and keeps the video
// well under the API's 64 MB limit at this bitrate.
const MAX_SECONDS = 60;
const COUNTDOWN = 3;
const BITRATE = 2_500_000;

// What each browser records best, in order of preference: WebM (Chrome,
// Edge, Firefox), then MP4 (Safari).
const TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];

// Below this share of frames with a hand tracked, the signer is told their
// hands were often out of view. It's advice: the take can still be sent.
const LOW_COVERAGE = 0.6;

export type SignTake = {
  video: Blob;
  /** An object URL to watch the take back; revoked when replaced. */
  url: string;
  /** What the browser recorded, e.g. "video/webm;codecs=vp9". */
  type: string;
  seconds: number;
  /** The landmarks file, or null when the tracker couldn't run. */
  landmarks: Blob | null;
  /** The same landmarks, read, for the avatar to replay. */
  track: LandmarksFile | null;
  /** The share of frames with a hand tracked, or null without tracking. */
  handCoverage: number | null;
};

/** Whether this browser can record from the camera at all. */
export const canRecordVideo = () =>
  typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;

type Phase =
  | { name: "starting" }
  | { name: "ready" }
  | { name: "countdown"; left: number }
  | { name: "recording"; elapsed: number }
  | { name: "failed"; message: string };

type Tracking = "loading" | "on" | "off";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

async function loadTracker(): Promise<HolisticLandmarker> {
  const { FilesetResolver, HolisticLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO" as const,
    outputFaceBlendshapes: true,
  });
  try {
    return await HolisticLandmarker.createFromOptions(fileset, options("GPU"));
  } catch {
    return HolisticLandmarker.createFromOptions(fileset, options("CPU"));
  }
}

/**
 * Records one signed take from the camera. The preview is mirrored, like a
 * mirror, and shows the tracked hand points so the signer can see they're in
 * view. Press record, get into position during the countdown, sign, then
 * press stop (or reach the time limit). The landmarks are logged frame by
 * frame alongside the video. The parent holds the take.
 */
function SignRecorder({
  take,
  onChange,
  disabled,
}: {
  take: SignTake | null;
  onChange: (take: SignTake | null) => void;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "starting" });
  const [tracking, setTracking] = useState<Tracking>("loading");
  const [handsInView, setHandsInView] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Watching a take back: the video, or the avatar replaying its landmarks.
  const [watch, setWatch] = useState<"video" | "avatar">("video");

  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const tracker = useRef<HolisticLandmarker | null>(null);
  const log = useRef<LandmarkLog | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Read inside the tracking loop, which outlives renders.
  const recordingSince = useRef<number | null>(null);
  const paused = useRef(false);
  const handsShown = useRef(false);

  // Tracking pauses while the signer watches a take back.
  useEffect(() => {
    paused.current = !!take;
  }, [take]);

  // Camera and tracker start together; recording works without the tracker.
  useEffect(() => {
    let cancelled = false;
    let frame: number | null = null;
    let lastTime = -1;

    const draw = (points: { x: number; y: number }[][]) => {
      const el = canvas.current;
      const v = video.current;
      const g = el?.getContext("2d");
      if (!el || !v || !g) return;
      if (el.width !== v.videoWidth) el.width = v.videoWidth;
      if (el.height !== v.videoHeight) el.height = v.videoHeight;
      g.clearRect(0, 0, el.width, el.height);
      g.fillStyle = getComputedStyle(el).color;
      const r = Math.max(3, el.width / 240);
      for (const hand of points) {
        for (const p of hand) {
          g.beginPath();
          g.arc(p.x * el.width, p.y * el.height, r, 0, Math.PI * 2);
          g.fill();
        }
      }
    };

    const tick = () => {
      const v = video.current;
      const t = tracker.current;
      if (v && t && !paused.current && v.readyState >= 2 && v.currentTime !== lastTime) {
        lastTime = v.currentTime;
        const now = performance.now();
        try {
          const result = t.detectForVideo(v, now);
          const hands = [...result.leftHandLandmarks, ...result.rightHandLandmarks];
          draw(hands);
          if (recordingSince.current !== null) log.current?.add(result, (now - recordingSince.current) / 1000);
          const inView = hands.length > 0;
          if (inView !== handsShown.current) {
            handsShown.current = inView;
            setHandsInView(inView);
          }
        } catch {
          // A frame the tracker can't read is skipped; the video still records.
        }
      }
      frame = requestAnimationFrame(tick);
    };

    (async () => {
      let media: MediaStream;
      try {
        media = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
      } catch {
        if (!cancelled) setPhase({ name: "failed", message: "Allow the camera for this site to record." });
        return;
      }
      if (cancelled) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const settings = media.getVideoTracks()[0]?.getSettings() ?? {};
      log.current = createLandmarkLog({
        tracker: TRACKER,
        video: { width: settings.width ?? 0, height: settings.height ?? 0 },
      });
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play().catch(() => undefined);
      }
      setPhase({ name: "ready" });
      frame = requestAnimationFrame(tick);
    })();

    loadTracker().then(
      (t) => {
        if (cancelled) {
          t.close();
          return;
        }
        tracker.current = t;
        setTracking("on");
      },
      () => !cancelled && setTracking("off"),
    );

    return () => {
      cancelled = true;
      if (frame !== null) cancelAnimationFrame(frame);
      if (timer.current) clearInterval(timer.current);
      // Leaving mid-take drops it.
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      tracker.current?.close();
      tracker.current = null;
    };
  }, [attempt]);

  // Free the previous take's object URL when it's replaced or dropped.
  useEffect(() => {
    if (!take) return;
    return () => URL.revokeObjectURL(take.url);
  }, [take]);

  const record = () => {
    const media = stream.current;
    if (!media) return;
    const type = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const rec = new MediaRecorder(media, { ...(type && { mimeType: type }), videoBitsPerSecond: BITRATE });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      const since = recordingSince.current ?? performance.now();
      recordingSince.current = null;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      const mime = rec.mimeType || type || "video/webm";
      const blob = new Blob(chunks, { type: mime });
      const current = log.current;
      const tracked = tracker.current && current && current.file().frames.length > 0 ? current : null;
      const track = tracked ? tracked.file() : null;
      setWatch("video");
      onChange({
        video: blob,
        url: URL.createObjectURL(blob),
        type: mime,
        seconds: (performance.now() - since) / 1000,
        landmarks: track ? new Blob([JSON.stringify(track)], { type: "application/json" }) : null,
        track,
        handCoverage: tracked ? tracked.handCoverage() : null,
      });
      setPhase({ name: "ready" });
    };
    recorder.current = rec;
    log.current?.reset();
    recordingSince.current = performance.now();
    rec.start(1000);
    setPhase({ name: "recording", elapsed: 0 });
    timer.current = setInterval(() => {
      const s = (performance.now() - (recordingSince.current ?? performance.now())) / 1000;
      setPhase({ name: "recording", elapsed: s });
      if (s >= MAX_SECONDS && rec.state === "recording") rec.stop();
    }, 200);
  };

  // A countdown gives the signer time to bring their hands into position.
  const start = () => {
    onChange(null);
    let left = COUNTDOWN;
    setPhase({ name: "countdown", left });
    timer.current = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setPhase({ name: "countdown", left });
        return;
      }
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      record();
    }, 1000);
  };

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const cancelCountdown = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPhase({ name: "ready" });
  };

  if (phase.name === "failed") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-inset border border-line p-6 text-center">
        <p className="text-sm text-subtle">{phase.message}</p>
        <button
          type="button"
          onClick={() => {
            setPhase({ name: "starting" });
            setAttempt((n) => n + 1);
          }}
          className={secondaryButton}
        >
          Try again
        </button>
      </div>
    );
  }

  const recording = phase.name === "recording";
  const counting = phase.name === "countdown";
  const lowCoverage = take?.handCoverage != null && take.handCoverage < LOW_COVERAGE;

  const replaying = !!take?.track && watch === "avatar";

  return (
    <div className="flex w-full flex-col gap-4">
      {take?.track && (
        <Segmented
          label="Watch your take"
          value={watch}
          onChange={(id) => setWatch(id as "video" | "avatar")}
          items={[
            { id: "video", label: "Video" },
            { id: "avatar", label: "Avatar" },
          ]}
          className="self-start"
        />
      )}
      {replaying && take?.track && <SignReplay landmarks={take.track} />}
      {/* The camera stays mounted under the replay, so its stream is kept. */}
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-inset border border-line bg-background",
          replaying && "hidden",
        )}
      >
        {/* The live camera stays on between takes, so recording again is instant. */}
        <video
          ref={video}
          muted
          playsInline
          aria-label="Camera preview"
          className={cn("absolute inset-0 size-full -scale-x-100 object-cover", take && "invisible")}
        />
        <canvas
          ref={canvas}
          aria-hidden
          className={cn("absolute inset-0 size-full -scale-x-100 object-cover text-signal", take && "invisible")}
        />
        {/* Played back as recorded, the way a viewer sees the signer. */}
        {take && (
          <video
            src={take.url}
            controls
            playsInline
            aria-label="Your take"
            className="absolute inset-0 size-full bg-background object-contain"
          />
        )}
        {phase.name === "starting" && (
          <p className="absolute inset-0 flex items-center justify-center font-mono text-xs text-faint">
            Starting the camera…
          </p>
        )}
        {counting && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/40 text-7xl tabular-nums">
            {phase.left}
          </span>
        )}
        {recording && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 font-mono text-xs tabular-nums">
            <span className="size-2 rounded-full bg-signal motion-safe:animate-pulse" />
            {clock(phase.elapsed)} / {clock(MAX_SECONDS)}
          </span>
        )}
        {!take && tracking === "on" && phase.name !== "starting" && (
          <span className="absolute top-3 right-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[11px] text-subtle">
            {handsInView ? "Hands in view" : "Bring your hands into view"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-faint">
          {take
            ? lowCoverage
              ? "Your hands were out of view for much of this take. Watch it back, and record again if needed."
              : `${clock(take.seconds)} recorded. Watch it back, or record again.`
            : tracking === "loading"
              ? "Loading hand tracking…"
              : tracking === "off"
                ? "Hand tracking can't run on this device. Your video still records."
                : `Up to ${MAX_SECONDS} seconds. A ${COUNTDOWN}-second countdown starts each take.`}
        </span>
        <div className="flex items-center gap-2">
          {take && (
            <button type="button" onClick={() => onChange(null)} disabled={disabled} className={quietButton}>
              Discard
            </button>
          )}
          {counting ? (
            <button type="button" onClick={cancelCountdown} className={quietButton}>
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={recording ? stop : start}
              disabled={disabled || phase.name === "starting"}
              aria-label={recording ? "Stop recording" : take ? "Record again" : "Start recording"}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-mono text-xs text-background transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                recording ? "bg-foreground" : "bg-signal hover:bg-signal/85",
              )}
            >
              <HugeiconsIcon icon={recording ? StopIcon : RecordIcon} strokeWidth={2} className="size-4" />
              {recording ? "Stop" : take ? "Record again" : "Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { SignRecorder };
