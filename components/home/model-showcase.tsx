"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BarChart } from "@/components/benchmarks/bar-chart";
import type { BenchmarkEntry } from "@/components/benchmarks/data";
import { FRAME, FRAME_PANELS, HALO } from "@/components/system/framed-card";
import { DirectionLabel, Segmented } from "@/components/system/segmented";
import { cn } from "@/lib/utils";

export type ShowcaseSet = {
  id: string;
  from: string;
  to: string;
  model: { slug: string; name: string; tagline: string; platforms: string[]; overview: string };
  entries: BenchmarkEntry[];
  evalSet: string;
};

// How long each card stays in front before the next one comes up: long
// enough to read the overview and scan the chart.
const DWELL_MS = 9000;
// Layers drawn in the stack, real cards first, then empty frames.
const STACK_LAYERS = 3;
// Each layer back sits this much higher and smaller, peeking over the one in front.
const STEP_Y = 14;
const STEP_SCALE = 0.04;

// A framed card with two flush panels: the model on the left (about a
// third of the width), its scores on the right.
const CARD = cn("relative col-start-1 row-start-1 flex", FRAME);
const PANELS = cn("grid flex-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]", FRAME_PANELS);
const MODEL_PANEL = "bg-surface-warm";
const SCORE_PANEL = "bg-[#0b0a07]";

// A model and how it measures up, on a stack of cards: the hero's proof
// that the infrastructure exists. The deck cycles on its own while it is on
// screen and nobody is hovering or focused inside it; the direction toggle
// brings any card to the front.
function ModelShowcase({ sets, className }: { sets: ShowcaseSet[]; className?: string }) {
  const [active, setActive] = useState(sets[0].id);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  const playing = sets.length > 1 && inView && !hovering && !focused && !reduce;

  // Restarts whenever the front card changes, so a manual pick gets a full dwell.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const i = sets.findIndex((s) => s.id === active);
      setActive(sets[(i + 1) % sets.length].id);
    }, DWELL_MS);
    return () => clearTimeout(timer);
  }, [playing, active, sets]);

  // The front card first, the rest behind it in their original order.
  const order = [active, ...sets.map((s) => s.id).filter((id) => id !== active)];
  const items = sets.map((s) => ({ id: s.id, label: <DirectionLabel from={s.from} to={s.to} /> }));

  return (
    <div
      ref={ref}
      className={cn("relative isolate mx-auto grid w-full pt-8 xl:w-[90%]", className)}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {/* A soft yellow halo around the whole stack. */}
      <div aria-hidden className={cn(HALO, "inset-x-0 top-8 bottom-0")} />

      {Array.from({ length: Math.max(0, STACK_LAYERS - sets.length) }, (_, i) => {
        const depth = sets.length + i;
        return (
          <div
            key={depth}
            aria-hidden
            className={CARD}
            style={{ zIndex: STACK_LAYERS - depth, transformOrigin: "top", transform: `translateY(${depth * -STEP_Y}px) scale(${1 - depth * STEP_SCALE})` }}
          >
            <div className={PANELS}>
              <div className={MODEL_PANEL} />
              <div className={SCORE_PANEL} />
            </div>
          </div>
        );
      })}

      {sets.map((set) => {
        const depth = order.indexOf(set.id);
        const front = depth === 0;
        return (
          <motion.div
            key={set.id}
            inert={!front}
            initial={false}
            animate={{
              scale: 1 - depth * STEP_SCALE,
              y: front ? [null, 40, 0] : depth * -STEP_Y,
            }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    default: { type: "spring", bounce: 0.3, duration: 0.6 },
                    y: front ? { duration: 0.6, times: [0, 0.4, 1], ease: "easeOut" } : { type: "spring", bounce: 0.3, duration: 0.6 },
                  }
            }
            style={{ zIndex: STACK_LAYERS - depth, originY: 0 }}
            className={CARD}
          >
            <div className={PANELS}>
              <div className={cn(MODEL_PANEL, "flex flex-col gap-5 px-5 py-8 sm:px-6")}>
                <Link href={`/models/${set.model.slug}`} className="text-[1.75rem] leading-tight tracking-[-0.01em] transition-colors hover:text-signal">
                  {set.model.name}
                </Link>
                <p className="max-w-60 text-xs">{set.model.tagline}</p>
                <ul className="flex flex-wrap gap-2">
                  {set.model.platforms.map((p) => (
                    <li key={p} className="rounded-sm border border-line-strong px-1.5 py-0.5 text-[10px] text-foreground/85">
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 pt-2">
                  <span className="text-xs font-medium">Overview</span>
                  <p className="max-w-72 text-[11px] leading-relaxed text-faint">{set.model.overview}</p>
                </div>
              </div>

              <div className={cn(SCORE_PANEL, "flex min-w-0 flex-col gap-10 px-5 py-8 sm:px-10 sm:py-12 xl:pr-16 xl:pl-20")}>
                <Segmented label="Translation direction" value={active} onChange={setActive} items={items} className="self-start" />
                {/* Remounts on reaching the front, so the bars grow in again. */}
                <BarChart key={front ? "front" : "back"} title="BLEU" entries={set.entries} metric="bleu" />
                <p className="font-mono text-[11px] text-faint">{set.evalSet}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export { ModelShowcase };
