"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BarChart } from "@/components/benchmarks/bar-chart";
import type { BenchmarkEntry } from "@/components/benchmarks/data";
import { DirectionLabel, Segmented } from "@/components/system/segmented";

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
// Layers drawn in the stack, real cards first, then plain strips.
const STACK_LAYERS = 3;

// A model and how it measures up, on a stack of cards: the hero's proof
// that the infrastructure exists. The deck cycles on its own while it is on
// screen and nobody is hovering or focused inside it; the direction toggle
// brings any card to the front.
function ModelShowcase({ sets }: { sets: ShowcaseSet[] }) {
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
      className="relative isolate grid w-full pt-8"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {Array.from({ length: Math.max(0, STACK_LAYERS - sets.length) }, (_, i) => {
        const depth = sets.length + i;
        return (
          <div
            key={depth}
            aria-hidden
            className="absolute h-10 rounded-t-lg border border-line bg-surface"
            style={{ top: 32 - depth * 16, insetInline: `${depth * 3.5}%`, zIndex: STACK_LAYERS - depth, filter: `brightness(${1 - depth * 0.2})` }}
          />
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
              scale: 1 - depth * 0.07,
              y: front ? [null, 40, 0] : depth * -16,
              filter: `brightness(${1 - depth * 0.2})`,
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
            className="relative col-start-1 row-start-1 grid overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]"
          >
            <div className="flex flex-col gap-5 bg-surface-warm p-7 sm:p-9">
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

            <div className="flex min-w-0 flex-col gap-10 p-7 sm:p-10">
              <Segmented label="Translation direction" value={active} onChange={setActive} items={items} className="self-start" />
              {/* Remounts on reaching the front, so the bars grow in again. */}
              <BarChart key={front ? "front" : "back"} title="BLEU" entries={set.entries} metric="bleu" />
              <p className="font-mono text-[11px] text-faint">{set.evalSet}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export { ModelShowcase };
