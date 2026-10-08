"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadar } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { FilterSelect } from "@/components/system/filters";

import { radarAxes, type RadarScores } from "./civicbench-preview";

type RadarModel = { slug: string; name: string; scores: RadarScores };

const SERIES = ["var(--signal)", "var(--teal)", "var(--ocean)", "var(--lilac)"];

// The models' scores across the CivicBench Africa tasks, on a shadcn
// (Recharts) radar with its tooltip. Styled after the mock: a faint polygon
// grid, white nodes at the outer corners, mono labels, and a pair of yellow
// wireframe ribbons behind it.
function RadarChart({ models, initial }: { models: RadarModel[]; initial: string[] }) {
  const [selected, setSelected] = useState(initial);
  const reduce = useReducedMotion();
  const shown = selected
    .map((slug) => models.find((m) => m.slug === slug))
    .filter((m): m is RadarModel => m !== undefined);
  const addable = models.filter((m) => !selected.includes(m.slug));

  const colorOf = (m: RadarModel) => SERIES[selected.indexOf(m.slug)];
  const config = Object.fromEntries(
    shown.map((m) => [m.slug, { label: m.name, color: colorOf(m) }]),
  ) satisfies ChartConfig;
  // One row per task; `outer` traces the outermost ring to carry the nodes.
  const data = radarAxes.map((axis) => ({
    axis,
    outer: 100,
    ...Object.fromEntries(shown.map((m) => [m.slug, m.scores[axis]])),
  }));

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

      <div className="relative isolate grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* The wireframe ribbons from the mock, rising behind either side. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_20%,#000_75%,transparent)] lg:block">
          <div className="absolute top-[24%] left-[8%] aspect-[1005/565] w-[30rem] -scale-x-100 bg-[url(/tour-ribbon.svg)] bg-contain bg-no-repeat opacity-15" />
          <div className="absolute top-[8%] right-[-6%] aspect-[1005/565] w-[44rem] bg-[url(/tour-ribbon.svg)] bg-contain bg-no-repeat opacity-10" />
        </div>

        {/* The mock's height, capped at 62% of the screen's height (zoom
            undone), so on large screens it still fits in view. */}
        <ChartContainer
          config={config}
          role="img"
          aria-label="Radar chart of CivicBench Africa task scores"
          className="aspect-auto h-[26rem] w-full sm:h-[min(31rem,calc(62dvh/var(--viewport-scale)))] [&_.recharts-polar-grid_polygon]:stroke-white/10 [&_.recharts-surface]:overflow-visible"
        >
          <RechartsRadar data={data} outerRadius="82%" margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent className="min-w-56 gap-2 rounded-card border-line bg-surface-2 font-mono" />}
            />
            <PolarGrid gridType="polygon" />
            <PolarRadiusAxis domain={[0, 100]} tickCount={6} tick={false} axisLine={false} />
            <PolarAngleAxis
              dataKey="axis"
              tickLine={false}
              tickSize={22}
              tick={{ fill: "var(--foreground)", fontFamily: "var(--font-plex-mono)", fontSize: 15 }}
            />
            {/* The nodes on the outer ring; no line, no fill, no tooltip row. */}
            <Radar
              dataKey="outer"
              stroke="none"
              fill="none"
              dot={{ r: 5, fill: "white", fillOpacity: 1, stroke: "none" }}
              tooltipType="none"
              isAnimationActive={false}
            />
            {shown.map((m) => (
              <Radar
                key={m.slug}
                dataKey={m.slug}
                stroke={`var(--color-${m.slug})`}
                strokeWidth={2}
                fill={`var(--color-${m.slug})`}
                fillOpacity={0.1}
                isAnimationActive={!reduce}
                animationDuration={600}
              />
            ))}
          </RechartsRadar>
        </ChartContainer>

        <ul className="flex flex-col gap-4 lg:pt-14">
          {shown.map((m) => (
            <li key={m.slug} className="flex items-center gap-3 font-mono text-base">
              <span className="size-4 shrink-0 rounded-full" style={{ background: colorOf(m) }} />
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
