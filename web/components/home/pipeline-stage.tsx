"use client";

import { motion, useReducedMotion } from "motion/react";

import type { WorkedExample } from "@/components/civic/data";
import { cn } from "@/lib/utils";

// The civic speech pipeline, one stage at a time: voice → transcription →
// translation → civic record. Each stage is drawn as the thing it produces,
// revealed by a scan line sweeping across it.

const PIPELINE_STAGES = ["Voice", "Transcription", "Translation", "Civic record"] as const;

const EASE = [0.22, 1, 0.36, 1] as const;
const SWEEP_S = 0.75;

const BARS = 36;
// Deterministic bar heights (stable across server/client).
const heights = Array.from({ length: BARS }, (_, i) => {
  const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  const envelope = Math.sin((i / (BARS - 1)) * Math.PI);
  // Rounded so the server and browser render identical heights.
  return Math.round((0.2 + (0.35 + v * 0.45) * envelope) * 1e4) / 1e4;
});

// The stage's output, revealed left to right by a yellow scan line. Remount
// it (a new key) to play the reveal again.
function StageReveal({ stage, example }: { stage: number; example: WorkedExample }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-inset bg-white/6">
      <motion.div
        initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: SWEEP_S, ease: EASE }}
      >
        <StageOutput stage={stage} example={example} animate={!reduce} />
      </motion.div>
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-signal"
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: SWEEP_S, ease: EASE }}
        />
      )}
    </div>
  );
}

function StageOutput({
  stage,
  example,
  animate,
}: {
  stage: number;
  example: WorkedExample;
  animate: boolean;
}) {
  if (stage === 0) {
    return (
      <div className="flex items-center gap-4 py-5 pr-6 pl-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-signal">
          <span className="ml-0.5 size-0 border-y-[6px] border-l-10 border-y-transparent border-l-background" />
        </span>
        <span className="flex h-12 flex-1 items-center gap-0.75" aria-hidden>
          {heights.map((h, i) => (
            <span
              key={i}
              className="w-full rounded-full bg-foreground/70"
              style={{
                height: `${h * 100}%`,
                animation: animate ? `cm-wave 1s ease-in-out ${(i % 7) * 0.08}s infinite alternate` : undefined,
              }}
            />
          ))}
        </span>
        <style>{`@keyframes cm-wave { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }`}</style>
      </div>
    );
  }

  if (stage === 1 || stage === 2) {
    const transcript = stage === 1;
    return (
      <div className="flex flex-col gap-3 px-6 py-5">
        <span className="text-xs text-faint">{transcript ? example.language : "English"}</span>
        <p className={cn("text-pretty", transcript ? "font-mono text-[15px] leading-relaxed" : "text-lg leading-snug")}>
          {transcript ? example.source : example.reference}
        </p>
      </div>
    );
  }

  return (
    <dl className="flex flex-col gap-3 p-6 font-mono text-[13px]">
      {example.record.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <dt className="text-signal">{key}</dt>
          <dd className="text-foreground/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export { PIPELINE_STAGES, StageReveal };
