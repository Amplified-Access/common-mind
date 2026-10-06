"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { ContourField } from "@/components/system/contour-field";
import { FilterSelect } from "@/components/system/filters";

import { radarAxes, type RadarScores } from "./civicbench-preview";

type RadarModel = { slug: string; name: string; scores: RadarScores };

const SERIES = ["var(--signal)", "var(--teal)", "var(--ocean)", "var(--lilac)"];
const SIZE = 420;
const C = SIZE / 2;
const R = 150;

// Point on axis i at value v (0–100), starting from the top, clockwise.
// Rounded so server and client markup match.
function point(i: number, v: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / radarAxes.length;
  const r = (v / 100) * R;
  return [Math.round((C + r * Math.cos(angle)) * 10) / 10, Math.round((C + r * Math.sin(angle)) * 10) / 10];
}

const polygon = (values: number[]) => values.map((v, i) => point(i, v).join(",")).join(" ");

function RadarChart({ models, initial }: { models: RadarModel[]; initial: string[] }) {
  const [selected, setSelected] = useState(initial);
  const reduce = useReducedMotion();
  const shown = selected
    .map((slug) => models.find((m) => m.slug === slug))
    .filter((m): m is RadarModel => m !== undefined);
  const addable = models.filter((m) => !selected.includes(m.slug));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-3">
        {shown.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => setSelected((s) => s.filter((x) => x !== m.slug))}
            disabled={shown.length === 1}
            aria-label={`Remove ${m.name}`}
            className="inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-signal px-4 py-1.5 font-mono text-xs text-background transition-colors hover:bg-signal/85 disabled:cursor-default"
          >
            {m.name}
            {shown.length > 1 && <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />}
          </button>
        ))}
        {addable.length > 0 && selected.length < SERIES.length && (
          <FilterSelect
            label="Add Model"
            value=""
            onChange={(slug) => slug && setSelected((s) => [...s, slug])}
            options={[{ value: "", label: "Add a model" }, ...addable.map((m) => ({ value: m.slug, label: m.name }))]}
            className="rounded-full border border-signal px-4 py-1.5 text-xs"
          />
        )}
      </div>

      <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ContourField
          className="absolute inset-x-0 top-1/4 -z-10 h-3/4 w-full opacity-30"
          lines={34}
          peak={0.45}
          seed={3}
        />
        <svg viewBox={`-150 -10 ${SIZE + 300} ${SIZE + 50}`} className="mx-auto w-full max-w-3xl" role="img" aria-label="Radar chart of CivicBench Africa task scores">
          {[20, 40, 60, 80, 100].map((ring) => (
            <polygon
              key={ring}
              points={polygon(radarAxes.map(() => ring))}
              fill="none"
              stroke="white"
              strokeOpacity={ring === 100 ? 0.18 : 0.08}
            />
          ))}
          {radarAxes.map((axis, i) => {
            const [x, y] = point(i, 100);
            const [lx, ly] = point(i, 122);
            return (
              <g key={axis}>
                <line x1={C} y1={C} x2={x} y2={y} stroke="white" strokeOpacity={0.08} />
                <circle cx={x} cy={y} r={4} fill="white" />
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor={Math.abs(lx - C) < 10 ? "middle" : lx > C ? "start" : "end"}
                  className="fill-foreground font-mono text-[13px]"
                >
                  {axis}
                </text>
              </g>
            );
          })}
          <circle cx={C} cy={C} r={3} fill="white" fillOpacity={0.7} />
          {shown.map((m) => {
            const color = SERIES[selected.indexOf(m.slug)];
            return (
              <motion.polygon
                key={m.slug}
                points={polygon(radarAxes.map((a) => m.scores[a]))}
                fill={color}
                fillOpacity={0.1}
                stroke={color}
                strokeWidth={2}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: `${C}px ${C}px` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </svg>
        <ul className="flex flex-col gap-4">
          {shown.map((m) => (
            <li key={m.slug} className="flex items-center gap-3 font-mono text-base">
              <span className="size-4 rounded-full" style={{ background: SERIES[selected.indexOf(m.slug)] }} />
              {m.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { RadarChart };
export type { RadarModel };
