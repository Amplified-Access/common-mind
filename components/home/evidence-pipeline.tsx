"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { workedExamples, type WorkedExample } from "@/components/civic/data";
import { cn } from "@/lib/utils";

// One surface that becomes the next thing: voice → transcript → translation
// → civic record. The surface morphs its shape while a scan line sweeps
// across it, revealing the new form behind it. Everything lives inside a
// fixed-size stage, so nothing around it moves.

const STAGES = ["Voice", "Transcript", "Translation", "Civic record"] as const;
const DURATION = [2600, 3400, 3400, 4600];

const EASE = [0.22, 1, 0.36, 1] as const;
const MORPH_S = 0.65;
const SWEEP_S = 0.75;
const CLEAR_S = 0.18;

const BARS = 36;
// Deterministic bar heights (stable across server/client).
const heights = Array.from({ length: BARS }, (_, i) => {
  const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  const envelope = Math.sin((i / (BARS - 1)) * Math.PI);
  return 0.2 + (0.35 + v * 0.45) * envelope;
});

// The surface's form at each stage.
const SURFACE = [
  { radius: 999, background: "rgba(255, 255, 255, 0.06)" },
  { radius: 28, background: "rgba(255, 255, 255, 0.06)" },
  { radius: 28, background: "rgba(255, 255, 255, 0.06)" },
  { radius: 24, background: "rgba(10, 10, 11, 0.7)" },
];

function EvidencePipeline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const example = workedExamples[index];
  const key = `${index}-${stage}`;

  useEffect(() => {
    const id = setTimeout(() => {
      if (stage < STAGES.length - 1) {
        setStage(stage + 1);
      } else {
        setStage(0);
        setIndex((i) => (i + 1) % workedExamples.length);
      }
    }, DURATION[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <div
      className={cn(
        "relative flex h-120 flex-col overflow-hidden rounded-3xl bg-surface",
        className,
      )}
    >
      {/* Stage indicator: fixed height, never reflows */}
      <ol className="flex items-center gap-5 px-8 pt-7 text-xs">
        {STAGES.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 transition-colors duration-500",
              i === stage ? "text-foreground" : "text-faint",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full transition-colors duration-500",
                i === stage ? "bg-signal" : i < stage ? "bg-white/40" : "bg-white/12",
              )}
            />
            <span className={cn(i !== stage && "hidden sm:inline")}>{label}</span>
          </li>
        ))}
      </ol>

      {/* The surface */}
      <div className="flex flex-1 items-center justify-center px-8">
        <motion.div
          layout
          initial={false}
          animate={{
            borderRadius: SURFACE[stage].radius,
            backgroundColor: SURFACE[stage].background,
          }}
          transition={{ duration: reduce ? 0 : MORPH_S, ease: EASE }}
          className="relative w-full max-w-sm overflow-hidden"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={key}
              layout="position"
              initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)" }}
              animate={
                reduce
                  ? { opacity: 1 }
                  : { clipPath: "inset(0 0% 0 0)", transition: { duration: SWEEP_S, ease: EASE } }
              }
              exit={{ opacity: 0, transition: { duration: CLEAR_S } }}
            >
              <Entity stage={stage} example={example} animate={!reduce} />
            </motion.div>
          </AnimatePresence>

          {/* Scan line: travels along the reveal edge */}
          {!reduce && (
            <motion.span
              key={`scan-${key}`}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-signal"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: SWEEP_S, delay: CLEAR_S, ease: EASE }}
            />
          )}
        </motion.div>
      </div>

      <p className="px-8 pb-7 text-xs text-faint">Sentence and reference: Sunbird SALT</p>
    </div>
  );
}

function Entity({
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
      <div className="flex items-center gap-4 py-4 pr-6 pl-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal">
          <span className="ml-0.5 size-0 border-y-[6px] border-l-10 border-y-transparent border-l-background" />
        </span>
        <span className="flex h-10 flex-1 items-center gap-0.75" aria-hidden>
          {heights.map((h, i) => (
            <span
              key={i}
              className="w-full rounded-full bg-foreground/70"
              style={{
                height: `${h * 100}%`,
                animation: animate
                  ? `cm-wave 1s ease-in-out ${(i % 7) * 0.08}s infinite alternate`
                  : undefined,
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
        <span className="text-xs text-faint">
          {transcript ? example.language : "English"}
        </span>
        <p
          className={cn(
            "text-pretty",
            transcript ? "font-mono text-[15px] leading-relaxed" : "text-lg leading-snug",
          )}
        >
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

export { EvidencePipeline };
