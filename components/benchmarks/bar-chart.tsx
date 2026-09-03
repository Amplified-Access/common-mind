"use client";

import { useState } from "react";

import type { BenchmarkEntry } from "./data";

const ACCENT = "#2a78d6";
const NEUTRAL = "#7d7b74";

type BarChartProps = {
  title: string;
  entries: BenchmarkEntry[];
  metric: "bleu" | "chrf";
};

function BarChart({ title, entries, metric }: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sorted = [...entries].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...sorted.map((e) => e[metric])) * 1.08;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
        {title}
      </h4>
      <div className="flex flex-col gap-2.5">
        {sorted.map((entry) => {
          const pct = (entry[metric] / max) * 100;
          return (
            <div
              key={entry.model}
              className="group relative flex items-center gap-3 outline-none"
              onPointerEnter={() => setHovered(entry.model)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(entry.model)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <div className="w-24 shrink-0 text-sm leading-tight text-black/70 sm:w-40 lg:w-44">
                {entry.model}
              </div>
              <div className="relative h-5 flex-1 rounded-r-[4px] bg-[#f4f4f4]">
                <div
                  className="h-5 rounded-r-[4px] transition-[width] duration-300 group-hover:brightness-90 group-focus:brightness-90"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: entry.isOurs ? ACCENT : NEUTRAL,
                  }}
                />
              </div>
              <div className="w-12 shrink-0 text-right text-sm font-medium text-black tabular-nums">
                {entry[metric].toFixed(2)}
              </div>

              {hovered === entry.model && (
                <div className="pointer-events-none absolute bottom-full left-28 z-10 mb-1.5 rounded-lg bg-black px-3 py-1.5 text-xs whitespace-nowrap text-white shadow-lg sm:left-40">
                  <span className="font-semibold">{entry[metric].toFixed(2)}</span>{" "}
                  <span className="text-white/70">
                    {title} · {entry.org}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { BarChart };
