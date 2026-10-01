"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BenchmarkEntry } from "./data";

type BarChartProps = {
  title: string;
  entries: BenchmarkEntry[];
  metric: "bleu" | "chrf";
  /** Fixed scale maximum, so charts in a group share an axis. */
  max?: number;
};

function BarChart({ title, entries, metric, max: fixedMax }: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const sorted = [...entries].sort((a, b) => b[metric] - a[metric]);
  const max = fixedMax ?? Math.max(...sorted.map((e) => e[metric])) * 1.08;

  return (
    <figure className="flex flex-col gap-8">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-subtle">{title}</span>
        <span className="flex items-center gap-4 text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-signal" /> CommonMind
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-white/25" /> Reference
          </span>
        </span>
      </figcaption>
      <ul className="flex flex-col gap-3">
        {sorted.map((entry, i) => {
          const pct = (entry[metric] / max) * 100;
          const dim = hovered !== null && hovered !== entry.model;
          return (
            <li
              key={entry.model}
              className={cn(
                "grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-3 transition-opacity duration-300 outline-none sm:grid-cols-[11rem_minmax(0,1fr)_3.5rem]",
                dim && "opacity-40",
              )}
              onPointerEnter={() => setHovered(entry.model)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(entry.model)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <span className="flex flex-col leading-tight">
                <a
                  href={entry.href}
                  target={entry.href.startsWith("/") ? undefined : "_blank"}
                  rel="noreferrer"
                  className={cn(
                    "truncate text-xs sm:text-sm",
                    entry.isOurs ? "text-foreground" : "text-subtle",
                  )}
                >
                  {entry.model}
                </a>
              </span>
              <span className="relative h-6 overflow-hidden rounded-[3px] bg-white/3">
                <motion.span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-[3px]",
                    entry.isOurs ? "bg-signal" : "bg-white/20",
                  )}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 1.1,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={reduce ? { width: `${pct}%` } : undefined}
                />
              </span>
              <span
                className={cn(
                  "text-right font-mono text-xs tabular-nums",
                  entry.isOurs ? "text-foreground" : "text-subtle",
                )}
              >
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
