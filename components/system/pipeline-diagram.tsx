"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type PipelineStage = {
  id: string;
  label: string;
  summary: string;
  href: string;
};

export type Outcome = {
  value: string;
  label: string;
  href: string;
};

export const platformStages: PipelineStage[] = [
  {
    id: "languages",
    label: "Languages",
    summary: "Each language carries its own civic vocabulary.",
    href: "/languages",
  },
  {
    id: "data",
    label: "Civic speech data",
    summary: "Corpora, speech, and terminology mappings.",
    href: "/research/civic-corpus",
  },
  {
    id: "models",
    label: "Models",
    summary: "Small, open models adapted for civic language.",
    href: "/models",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    summary: "Reproducible measurement of civic understanding.",
    href: "/benchmarks",
  },
  {
    id: "applications",
    label: "Civic applications",
    summary: "Community voice turned into structured evidence.",
    href: "/build",
  },
];

const HOLD_MS = 3600;

// Languages → Civic Speech Data → Models → Evaluation → Civic Applications.
// Each layer is its own door into the platform, and every layer funnels into
// one card: what comes out of the whole system.
function PipelineDiagram({
  outcomes,
  stages = platformStages,
  className,
}: {
  outcomes: Outcome[];
  stages?: PipelineStage[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const outputRef = useRef<HTMLAnchorElement>(null);
  const [geometry, setGeometry] = useState<{
    width: number;
    height: number;
    paths: { d: string; x: number; y: number }[];
    target: { x: number; y: number };
  } | null>(null);
  const [index, setIndex] = useState(0);

  // Measure card and output positions so the connectors land exactly.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const output = outputRef.current;
    if (!container || !output) return;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const out = output.getBoundingClientRect();
      const tx = out.left + out.width / 2 - box.left;
      const ty = out.top - box.top;
      const paths = cardRefs.current.flatMap((card) => {
        if (!card) return [];
        const r = card.getBoundingClientRect();
        const x = r.left + r.width / 2 - box.left;
        const y = r.bottom - box.top;
        const mid = y + (ty - y) * 0.55;
        return [{ d: `M ${x} ${y} C ${x} ${mid}, ${tx} ${mid}, ${tx} ${ty}`, x, y }];
      });
      setGeometry({ width: box.width, height: box.height, paths, target: { x: tx, y: ty } });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % outcomes.length), HOLD_MS);
    return () => clearInterval(id);
  }, [outcomes.length]);

  const current = outcomes[index];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Connectors (desktop): every layer funnels into the output */}
      {geometry && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          width={geometry.width}
          height={geometry.height}
          fill="none"
        >
          {geometry.paths.map((p, i) => (
            <g key={i}>
              <path d={p.d} className="stroke-white/15" strokeWidth={1} />
              {!reduce && (
                <path
                  d={p.d}
                  pathLength={100}
                  stroke="var(--signal)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="6 94"
                  style={{
                    animation: `cm-funnel 2.8s linear ${i * 0.35}s infinite`,
                  }}
                />
              )}
              <circle cx={p.x} cy={p.y} r={2.5} className="fill-white/40" />
            </g>
          ))}
          <circle cx={geometry.target.x} cy={geometry.target.y} r={3} fill="var(--signal)" />
          <style>{`@keyframes cm-funnel { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }`}</style>
        </svg>
      )}

      <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            <Link
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              href={stage.href}
              className="group flex h-full flex-col justify-between gap-6 rounded-3xl bg-surface p-6 transition-colors duration-300 hover:bg-surface-2 sm:min-h-56 sm:gap-10 sm:p-7"
            >
              <span className="flex items-center justify-between text-sm text-faint">
                {String(i + 1).padStart(2, "0")}
                <span className="text-lg transition-all duration-300 group-hover:translate-x-1 group-hover:text-signal">
                  →
                </span>
              </span>
              <span className="flex flex-col gap-3">
                <span className="text-xl tracking-tight">{stage.label}</span>
                <span className="text-sm text-pretty text-subtle">{stage.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Connector zone (desktop) / single line (mobile) */}
      <div className="flex h-16 justify-center lg:h-36">
        <span className="w-px bg-white/15 lg:hidden" />
      </div>

      {/* Output: what comes out of everything */}
      <Link
        ref={outputRef}
        href={current.href}
        className="group relative mx-auto flex aspect-square w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-signal p-8 text-background transition-[filter] duration-300 hover:brightness-105"
      >
        <Image
          src="/icon-black.svg"
          alt="CommonMind"
          width={160}
          height={147}
          className="h-10 w-auto self-start"
        />
        <div className="relative flex-1 perspective-distant">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center backface-hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-5xl font-medium tracking-tight tabular-nums sm:text-6xl">
                {current.value}
              </span>
              <span className="max-w-[16rem] text-background/70">{current.label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {outcomes.map((o, i) => (
              <span
                key={o.value}
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-500",
                  i === index ? "bg-background" : "bg-background/20",
                )}
              />
            ))}
          </div>
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </Link>
    </div>
  );
}

export { PipelineDiagram };
