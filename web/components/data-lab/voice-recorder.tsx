"use client";

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
 * Records one take from the microphone: start, stop (or the time limit),
 * then play it back or record again. The parent holds the take.
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

  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  // Stop the microphone if the volunteer leaves mid-take.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  // Free the previous take's object URL when it's replaced or dropped.
  useEffect(() => {
    if (!recording) return;
    return () => URL.revokeObjectURL(recording.url);
  }, [recording]);

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={recordingNow ? stop : start}
          disabled={disabled}
          aria-label={recordingNow ? "Stop recording" : recording ? "Record again" : "Start recording"}
          className={cn(
            "flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            recordingNow ? "bg-foreground" : "bg-signal hover:bg-signal/85",
          )}
        >
          {recordingNow ? (
            <span className="size-4 rounded-[3px] bg-background" />
          ) : (
            <span className="size-5 rounded-full bg-background" />
          )}
        </button>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm tabular-nums">
            {recordingNow ? (
              <>
                <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-signal align-middle" />
                {clock(elapsed)} / {clock(MAX_SECONDS)}
              </>
            ) : recording ? (
              clock(recording.seconds)
            ) : (
              "Ready to record"
            )}
          </span>
          <span className="font-mono text-xs text-faint">
            {recordingNow
              ? "Recording. Press stop when you're done."
              : recording
                ? "Listen back, or record again."
                : `Press to start. Up to ${MAX_SECONDS / 60} minutes.`}
          </span>
        </div>
      </div>
      {recording && !recordingNow && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls src={recording.url} className="h-10 max-w-full flex-1" />
          <button type="button" onClick={() => onChange(null)} disabled={disabled} className={quietButton}>
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

export { VoiceRecorder };
