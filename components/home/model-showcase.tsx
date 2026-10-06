"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

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

// A model and how it measures up, on a stack of cards: the hero's proof
// that the infrastructure exists. The direction toggle swaps both.
function ModelShowcase({ sets }: { sets: ShowcaseSet[] }) {
  const [active, setActive] = useState(sets[0].id);
  const reduce = useReducedMotion();
  const set = sets.find((s) => s.id === active) ?? sets[0];

  return (
    <div className="relative pt-8">
      {/* The stack behind the front card */}
      <div aria-hidden className="absolute inset-x-[7%] top-0 h-10 rounded-t-lg border border-line bg-[#0b0a07]" />
      <div aria-hidden className="absolute inset-x-[3.5%] top-3 h-10 rounded-t-lg border border-line bg-[#0e0d09]" />

      <div className="relative grid overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={set.model.slug}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5 bg-surface-warm p-7 sm:p-9"
          >
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
          </motion.div>
        </AnimatePresence>

        <div className="flex min-w-0 flex-col gap-10 p-7 sm:p-10">
          <Segmented
            label="Translation direction"
            value={set.id}
            onChange={setActive}
            items={sets.map((s) => ({ id: s.id, label: <DirectionLabel from={s.from} to={s.to} /> }))}
            className="self-start"
          />
          <BarChart key={set.id} title="BLEU" entries={set.entries} metric="bleu" />
          <p className="font-mono text-[11px] text-faint">{set.evalSet}</p>
        </div>
      </div>
    </div>
  );
}

export { ModelShowcase };
