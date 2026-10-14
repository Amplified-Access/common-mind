"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type Outcome = {
  value: string;
  label: string;
  href: string;
};

const PLATFORM_STAGES = [
  { id: "languages", label: "Languages", summary: "Each language carries its own civic vocabulary.", href: "/languages" },
  { id: "data", label: "Civic speech data", summary: "Corpora, speech, and terminology mappings.", href: "/research/civic-corpus" },
  { id: "models", label: "Models", summary: "Small, open models adapted for civic language.", href: "/models" },
  { id: "evaluation", label: "Evaluation", summary: "Reproducible measurement of civic understanding.", href: "/benchmarks" },
  { id: "applications", label: "Civic applications", summary: "Community voice turned into structured evidence.", href: "/build" },
];

const HOLD_MS = 2000;

// Languages → Civic Speech Data → Models → Evaluation → Civic Applications,
// every layer funnelling into one CommonMind card that flips through what
// comes out of the whole system. The layers sit in five equal columns, so
// the lines are drawn in proportion and land on them at any size or zoom.
function Funnel({ outcomes, playing }: { outcomes: Outcome[]; playing: boolean }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!playing || reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % outcomes.length), HOLD_MS);
    return () => clearInterval(id);
  }, [playing, reduce, outcomes.length]);

  const card = (className?: string) => (
    <OutcomeCard outcomes={outcomes} index={index} reduce={reduce} className={className} />
  );

  return (
    <>
      {/* Wide: the five layers side by side, lines converging on the card. */}
      <div className="hidden h-full flex-col justify-center px-10 py-8 lg:flex">
        <ol className="grid grid-cols-5">
          {PLATFORM_STAGES.map((stage, i) => (
            <li key={stage.id} className="relative px-1.5">
              <Link
                href={stage.href}
                className="flex h-full flex-col gap-3 rounded-inset border border-line bg-surface-warm p-4 transition-colors hover:border-signal/60"
              >
                <span className="font-mono text-[10px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm leading-tight">{stage.label}</span>
                <span className="text-[11px] leading-snug text-faint">{stage.summary}</span>
              </Link>
              <span aria-hidden className="absolute -bottom-0.75 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/40" />
            </li>
          ))}
        </ol>

        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="h-20 w-full">
          {PLATFORM_STAGES.map((stage, i) => {
            const x = (i + 0.5) * 20;
            const d = `M ${x} 0 C ${x} 55, 50 45, 50 100`;
            return (
              <g key={stage.id}>
                <path d={d} stroke="rgb(255 255 255 / 0.15)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                {!reduce && (
                  <path
                    d={d}
                    pathLength={100}
                    stroke="var(--signal)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray="6 94"
                    vectorEffect="non-scaling-stroke"
                    style={{ animation: `cm-funnel 2.8s linear ${i * 0.35}s infinite` }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {card("max-w-md")}
      </div>

      {/* Narrow: the deck's other cards stack tall here, so the layers
          stack too, spread over the card's height. */}
      <div className="flex h-full flex-col px-4 py-6 sm:px-10 sm:py-8 lg:hidden">
        <StackedLayers reduce={reduce} />
        {card()}
      </div>

      <style>{`
        @keyframes cm-funnel { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
      `}</style>
    </>
  );
}

// The five layers as a column, each with its own line to the CommonMind card
// below. Lines leave each card from a different point along its bottom edge,
// as the five columns do on wide screens, and run behind the cards beneath
// it, so they read as separate connections converging on one card rather
// than as steps in a sequence. Paths are drawn from measured positions, since
// the cards spread to fill whatever height the deck gives them.
function StackedLayers({ reduce }: { reduce: boolean | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [geo, setGeo] = useState<{ w: number; h: number; starts: { x: number; y: number }[] } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    // Fires once on observe, then on every resize.
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const starts = items.current.map((li, i) => ({
        x: (w * (i + 0.5)) / PLATFORM_STAGES.length,
        y: li ? li.offsetTop + li.offsetHeight : 0,
      }));
      setGeo({ w, h, starts });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrap} className="relative flex flex-1 flex-col pb-12">
      {geo && (
        <svg aria-hidden width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} fill="none" className="absolute inset-0">
          {geo.starts.map(({ x, y }, i) => {
            const mid = (geo.h - y) / 2;
            const d = `M ${x} ${y} C ${x} ${y + mid}, ${geo.w / 2} ${geo.h - mid}, ${geo.w / 2} ${geo.h}`;
            return (
              <g key={PLATFORM_STAGES[i].id}>
                <path d={d} stroke="rgb(255 255 255 / 0.15)" strokeWidth={1} />
                {!reduce && (
                  <path
                    d={d}
                    pathLength={100}
                    stroke="var(--signal)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray="6 94"
                    style={{ animation: `cm-funnel 2.8s linear ${i * 0.35}s infinite` }}
                  />
                )}
                <circle cx={x} cy={y} r={3} fill="rgb(255 255 255 / 0.4)" />
              </g>
            );
          })}
        </svg>
      )}
      <ol className="relative flex flex-1 flex-col justify-between gap-6">
        {PLATFORM_STAGES.map((stage, i) => (
          <li
            key={stage.id}
            ref={(el) => {
              items.current[i] = el;
            }}
          >
            <Link
              href={stage.href}
              className="flex gap-3 rounded-inset border border-line bg-surface-warm px-4 py-3 transition-colors hover:border-signal/60 sm:gap-4 sm:px-5 sm:py-5"
            >
              <span className="pt-0.5 font-mono text-[10px] text-faint sm:text-xs">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex flex-col gap-1 sm:gap-1.5">
                <span className="text-sm leading-tight sm:text-base">{stage.label}</span>
                <span className="text-[11px] leading-snug text-faint sm:text-sm">{stage.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

// The CommonMind card both layouts end on, flipping through what comes out
// of the whole platform.
function OutcomeCard({
  outcomes,
  index,
  reduce,
  className,
}: {
  outcomes: Outcome[];
  index: number;
  reduce: boolean | null;
  className?: string;
}) {
  const current = outcomes[index];
  return (
    <Link
      href={current.href}
      className={cn(
        "relative mx-auto flex w-full items-center gap-5 rounded-inset bg-signal px-5 py-4 text-background transition-[filter] hover:brightness-105 sm:px-6",
        className,
      )}
    >
      <span aria-hidden className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-signal" />
      <Image src="/icon-black.svg" alt="CommonMind" width={458} height={480} className="h-9 w-auto shrink-0" />
      <div className="relative h-16 flex-1 perspective-distant">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0 flex flex-col justify-center gap-1 backface-hidden"
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-3xl leading-none font-medium tracking-tight tabular-nums">{current.value}</span>
            <span className="text-xs text-background/70">{current.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span aria-hidden className="flex flex-col gap-1.5">
        {outcomes.map((o, i) => (
          <span
            key={o.value}
            className={cn("size-1.5 rounded-full transition-colors duration-500", i === index ? "bg-background" : "bg-background/20")}
          />
        ))}
      </span>
    </Link>
  );
}

export { Funnel };
