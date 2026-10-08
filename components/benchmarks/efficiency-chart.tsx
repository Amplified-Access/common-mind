"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import type { BenchmarkEntry } from "./data";

// Parameters (log scale) vs BLEU on the same FLORES-200 split. Only models
// with publicly disclosed parameter counts are plotted.
function EfficiencyChart({ entries }: { entries: BenchmarkEntry[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const points = entries.filter((e) => e.params !== undefined);
  const W = 640;
  const H = 360;
  const pad = { l: 44, r: 20, t: 20, b: 40 };
  const minP = Math.log10(0.5);
  const maxP = Math.log10(40);
  const maxB = 45;
  // Rounded so server and browser agree: Math.log10 can differ in the last
  // digit between engines, which breaks hydration.
  const round = (n: number) => Math.round(n * 100) / 100;
  const x = (p: number) =>
    round(pad.l + ((Math.log10(p) - minP) / (maxP - minP)) * (W - pad.l - pad.r));
  const y = (b: number) => round(H - pad.b - (b / maxB) * (H - pad.t - pad.b));

  const xTicks = [0.5, 1, 2, 4, 10, 27];
  const yTicks = [0, 10, 20, 30, 40];

  // Hand-tuned label offsets to avoid overlaps.
  const labelOffset: Record<string, [number, number, "start" | "end"]> = {
    "Swahili-nllb-1.3B": [10, -6, "start"],
    "Swahili-nllb-600M": [10, 6, "start"],
    "Swahili-gemma-1B-it": [10, -8, "start"],
    "Swahili-gemma-1B (Crane)": [10, 14, "start"],
    "Gemma 3 27B": [-10, -8, "end"],
    "Gemma 3 4B": [10, 4, "start"],
    "Gemma 3 1B (base)": [10, -6, "start"],
  };

  return (
    <figure className="flex flex-col gap-3">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Scatter plot of model parameters versus BLEU on English to Swahili FLORES-200"
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(t)}
              y2={y(t)}
              className="stroke-white/6"
            />
            <text
              x={pad.l - 10}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-faint font-mono text-[10px]"
            >
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={pad.t}
              y2={H - pad.b}
              className="stroke-white/4"
            />
            <text
              x={x(t)}
              y={H - pad.b + 18}
              textAnchor="middle"
              className="fill-faint font-mono text-[10px]"
            >
              {t}B
            </text>
          </g>
        ))}
        <text
          x={W - pad.r}
          y={H - 4}
          textAnchor="end"
          className="fill-faint font-mono text-[10px]"
        >
          parameters (log)
        </text>
        <text x={pad.l} y={12} className="fill-faint font-mono text-[10px]">
          BLEU
        </text>

        {points.map((p, i) => {
          const [dx, dy, anchor] = labelOffset[p.model] ?? [10, 4, "start"];
          // Each point rises from the zero line to its score.
          const rise = y(0) - y(p.bleu);
          return (
            <motion.g
              key={p.model}
              initial={reduce ? false : { y: rise }}
              animate={reduce || inView ? { y: 0 } : undefined}
              transition={{ duration: 1.1, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <circle
                cx={x(p.params!)}
                cy={y(p.bleu)}
                r={p.isOurs ? 5 : 4}
                className={cn(
                  p.isOurs ? "fill-signal" : "fill-other",
                )}
              />
              <text
                x={x(p.params!) + dx}
                y={y(p.bleu) + dy}
                textAnchor={anchor}
                className={cn(
                  "font-mono text-[10.5px]",
                  p.isOurs ? "fill-foreground" : "fill-subtle",
                )}
              >
                {p.model} · {p.bleu.toFixed(1)}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <figcaption className="font-mono text-xs text-faint">
        GPT-5 Mini and Gemini 2.0 Flash not plotted: size undisclosed.
      </figcaption>
    </figure>
  );
}

export { EfficiencyChart };
