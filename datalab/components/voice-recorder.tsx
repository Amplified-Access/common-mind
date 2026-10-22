"use client";

import { Mic01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { quietButton } from "./styles";

// A take is capped well under the API's 10 MB limit: Opus speech runs about
// 1 MB a minute.
const MAX_SECONDS = 180;

// What each browser records best, in order of preference: Opus in WebM
// (Chrome, Edge, Firefox), MP4 (Safari), then Ogg.
const TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];

// The waveform: one bar per animation frame's loudness, newest on the right.
const BAR = 3;
const GAP = 2;

export type Recording = {
  blob: Blob;
  /** An object URL to play the take back; revoked when replaced. */
  url: string;
  seconds: number;
  /** What the browser recorded, e.g. "audio/webm;codecs=opus". */
  type: string;
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Whether this browser can record audio at all. */
export const canRecordAudio = () =>
  typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;

/**
 * Records one take from the microphone: press the microphone to start, press
 * again (or reach the time limit) to stop, then play it back or record
 * again. While recording, a live waveform shows the voice is coming through.
 * The parent holds the take.
 */
function VoiceRecorder({
  recording,
  onChange,
  disabled,
}: {
  recording: Recording | null;
  onChange: (recording: Recording | null) => void;
  disabled?: boolean;
}) {
  const [elapsed, setElapsed] = useState<number | null>(null); // null when not recording
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const frame = useRef<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    void audio.current?.close();
    audio.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  // Stop the microphone if the volunteer leaves mid-take.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      void audio.current?.close();
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  // Free the previous take's object URL when it's replaced or dropped.
  useEffect(() => {
    if (!recording) return;
    return () => URL.revokeObjectURL(recording.url);
  }, [recording]);

  // Draws the voice's loudness as it arrives, scrolling right to left.
  const drawWaveform = (media: MediaStream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(media).connect(analyser);
    audio.current = ctx;

    const samples = new Uint8Array(analyser.fftSize);
    const levels: number[] = [];
    const tick = () => {
      const el = canvas.current;
      const g = el?.getContext("2d");
      if (el && g) {
        const dpr = window.devicePixelRatio || 1;
        const width = el.clientWidth;
        const height = el.clientHeight;
        if (el.width !== width * dpr) el.width = width * dpr;
        if (el.height !== height * dpr) el.height = height * dpr;

        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const s of samples) sum += ((s - 128) / 128) ** 2;
        // Speech sits low on the raw scale; lift it so a normal voice fills the bar.
        levels.push(Math.min(1, Math.sqrt(sum / samples.length) * 4));
        const count = Math.floor(width / (BAR + GAP));
        if (levels.length > count) levels.splice(0, levels.length - count);

        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, width, height);
        g.fillStyle = getComputedStyle(el).color;
        levels.forEach((level, i) => {
          const h = Math.max(2, level * height);
          const x = width - (levels.length - i) * (BAR + GAP);
          g.fillRect(x, (height - h) / 2, BAR, h);
        });
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Allow the microphone for this site to record.");
      return;
    }
    const type = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const rec = new MediaRecorder(media, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      const mime = rec.mimeType || type || "audio/webm";
      const blob = new Blob(chunks, { type: mime });
      release();
      setElapsed(null);
      onChange({ blob, url: URL.createObjectURL(blob), seconds: (Date.now() - startedAt) / 1000, type: mime });
    };
    stream.current = media;
    recorder.current = rec;
    onChange(null);
    rec.start();
    setElapsed(0);
    drawWaveform(media);
    timer.current = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS && rec.state === "recording") rec.stop();
    }, 200);
  };

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const recordingNow = elapsed !== null;

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <button
        type="button"
        onClick={recordingNow ? stop : start}
        disabled={disabled}
        aria-label={recordingNow ? "Stop recording" : recording ? "Record again" : "Start recording"}
        className={cn(
          "relative flex size-20 shrink-0 cursor-pointer items-center justify-center rounded-full text-background transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          recordingNow ? "bg-foreground" : "bg-foreground hover:bg-foreground/85",
        )}
      >
        {recordingNow && (
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-foreground/30 motion-reduce:hidden" />
        )}
        <HugeiconsIcon icon={recordingNow ? StopIcon : Mic01Icon} strokeWidth={2} className="relative size-8" />
      </button>

      {/* Two lines in every state, so the recorder never changes height. */}
      <div className="-mt-2 flex flex-col items-center gap-1">
        <span className="font-mono text-sm tabular-nums">
          {recordingNow
            ? `${clock(elapsed)} / ${clock(MAX_SECONDS)}`
            : recording
              ? clock(recording.seconds)
              : "Press to start"}
        </span>
        <span className="font-mono text-xs text-faint">
          {recordingNow
            ? "Recording. Press stop when you're done."
            : recording
              ? "Listen back, or press the microphone to record again."
              : `Up to ${MAX_SECONDS / 60} minutes.`}
        </span>
      </div>

      {/* One slot for the live waveform or the take's player. */}
      <div className="flex h-12 w-full max-w-md items-center justify-center gap-2">
        {recordingNow ? (
          <canvas ref={canvas} aria-hidden className="h-12 w-full text-foreground" />
        ) : (
          recording && (
            <>
              <audio controls src={recording.url} className="h-10 min-w-0 flex-1" />
              <button type="button" onClick={() => onChange(null)} disabled={disabled} className={quietButton}>
                Discard
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}

export { VoiceRecorder };
