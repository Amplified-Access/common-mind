"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FilterSelect, SearchField } from "@/components/system/filters";
import { TagChain } from "@/components/system/tag-chain";

export type LanguageEntry = {
  code: string;
  name: string;
  endonym?: string;
  family: string;
  branch: string;
  regions: string[];
  tagline: string;
  models: number;
  datasets: number;
};

const ALL = "all";
const unique = (values: string[]) => Array.from(new Set(values)).sort();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function LanguageGrid({ entries }: { entries: LanguageEntry[] }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [models, setModels] = useState(ALL);
  const [data, setData] = useState(ALL);

  const families = useMemo(() => unique(entries.map((e) => e.family)), [entries]);
  const regions = useMemo(() => unique(entries.flatMap((e) => e.regions)), [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (family === ALL || e.family === family) &&
        (region === ALL || e.regions.includes(region)) &&
        (models === ALL || (models === "yes" ? e.models > 0 : e.models === 0)) &&
        (data === ALL || (data === "yes" ? e.datasets > 0 : e.datasets === 0)) &&
        (!q || [e.name, e.endonym ?? "", e.branch, ...e.regions].join(" ").toLowerCase().includes(q)),
    );
  }, [entries, query, family, region, models, data]);

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2.5">
          <FilterSelect
            variant="pill"
            label="All Languages"
            value={family}
            onChange={setFamily}
            options={[{ value: ALL, label: "All families" }, ...families.map((f) => ({ value: f, label: f }))]}
          />
          <FilterSelect
            variant="pill"
            label="Region"
            value={region}
            onChange={setRegion}
            options={[{ value: ALL, label: "All regions" }, ...regions.map((r) => ({ value: r, label: r }))]}
          />
          <FilterSelect
            variant="pill"
            label="Model Availability"
            value={models}
            onChange={setModels}
            options={[
              { value: ALL, label: "Any" },
              { value: "yes", label: "With models" },
              { value: "no", label: "Open for contributors" },
            ]}
          />
          <FilterSelect
            variant="pill"
            label="Dataset Availability"
            value={data}
            onChange={setData}
            options={[
              { value: ALL, label: "Any" },
              { value: "yes", label: "With datasets" },
              { value: "no", label: "No datasets yet" },
            ]}
          />
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search Languages"
          label="Search languages"
          className="lg:max-w-md"
        />
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <li key={e.code} className="flex">
              <Link
                href={`/languages/${e.code}`}
                className="group flex w-full flex-col gap-6 rounded-lg border border-line bg-surface p-7 transition-colors hover:border-signal/60 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[1.75rem] leading-none tracking-[-0.01em]">{e.name}</span>
                    {e.endonym && <span className="font-mono text-sm text-faint">·{e.endonym}</span>}
                  </span>
                  <WaveMark />
                </div>
                <p className="max-w-xs text-sm text-pretty text-faint">{e.tagline}</p>
                <p className="font-mono text-sm text-signal">
                  {e.models > 0 || e.datasets > 0
                    ? `${plural(e.models, "model")} · ${plural(e.datasets, "dataset")}`
                    : "Open for contributors"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-4">
                  <TagChain tags={[e.branch, e.regions[0]]} size="sm" />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal text-background transition-transform group-hover:translate-x-0.5">
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.5} className="size-5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-faint">
          No languages match these filters yet.
        </p>
      )}
    </div>
  );
}

// Four bars of a voice waveform: the language as it is spoken.
function WaveMark() {
  return (
    <svg aria-hidden viewBox="0 0 34 34" className="size-9 shrink-0 text-foreground">
      {[
        [3, 11, 12],
        [12, 3, 28],
        [21, 7, 20],
        [30, 12, 10],
      ].map(([x, y, h]) => (
        <rect key={x} x={x - 1.25} y={y} width={2.5} height={h} rx={1.25} fill="currentColor" />
      ))}
    </svg>
  );
}

export { LanguageGrid };
