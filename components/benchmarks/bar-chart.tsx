"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BenchmarkEntry } from "./data";

type BarChartProps = {
  /** The metric's name, shown beside the score column. */
  title: string;
  entries: BenchmarkEntry[];
  metric: "bleu" | "chrf";
  /** Fixed scale maximum, so charts in a group share an axis. */
  max?: number;
  className?: string;
};

// Models ranked by score: CommonMind in yellow, everyone else in purple.
// Each name links to its source.
function BarChart({ title, entries, metric, max: fixedMax, className }: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const sorted = [...entries].sort((a, b) => b[metric] - a[metric]);
  const max = fixedMax ?? Math.max(...sorted.map((e) => e[metric])) * 1.05;

  return (
    <figure className={cn("flex min-w-0 flex-col gap-6", className)}>
      <figcaption className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-baseline gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <span className="text-sm uppercase">Model</span>
        <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className="text-sm uppercase">
            Score <span className="font-mono text-xs text-faint normal-case">· {title}</span>
          </span>
          <span className="flex items-center gap-5 font-mono text-xs text-faint">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-signal" /> CommonMind
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-other" /> Other
            </span>
          </span>
        </span>
      </figcaption>
      <ul className="flex flex-col gap-3.5">
        {sorted.map((entry, i) => {
          const pct = (entry[metric] / max) * 100;
          const dim = hovered !== null && hovered !== entry.model;
          return (
            <li
              key={entry.model}
              className={cn(
                "grid grid-cols-[8.5rem_minmax(0,1fr)_3rem] items-center gap-4 transition-opacity duration-300 outline-none sm:grid-cols-[12rem_minmax(0,1fr)_3.5rem]",
                dim && "opacity-40",
              )}
              onPointerEnter={() => setHovered(entry.model)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(entry.model)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <a
                href={entry.href}
                target={entry.href.startsWith("/") ? undefined : "_blank"}
                rel="noreferrer"
                className="truncate font-mono text-xs text-foreground/90 transition-colors hover:text-signal sm:text-[13px]"
              >
                {entry.model}
              </a>
              <span className="relative h-2.5 overflow-hidden rounded-full bg-track">
                <motion.span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    entry.isOurs ? "bg-signal" : "bg-other",
                  )}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={reduce ? { width: `${pct}%` } : undefined}
                />
              </span>
              <span className="text-right font-mono text-xs text-foreground/90 tabular-nums sm:text-[13px]">
                {entry[metric].toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export { BarChart };
