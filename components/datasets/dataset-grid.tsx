"use client";

import { useMemo, useState } from "react";

import { cardColor, ColorCard } from "@/components/system/color-card";
import { FilterChips, FilterSelect, SearchField } from "@/components/system/filters";

import { datasets, type DatasetKind } from "./data";

const ALL = "all";
const kinds: DatasetKind[] = ["Parallel", "Monolingual", "Instruction", "Question Answering", "Evaluation"];
const unique = (values: string[]) => Array.from(new Set(values)).sort();

function DatasetGrid() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(ALL);
  const [language, setLanguage] = useState(ALL);
  const [source, setSource] = useState(ALL);

  const languages = useMemo(() => unique(datasets.flatMap((d) => d.languages)), []);
  const sources = useMemo(() => unique(datasets.map((d) => d.source)), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return datasets.filter(
      (d) =>
        (kind === ALL || d.kind === kind) &&
        (language === ALL || d.languages.includes(language)) &&
        (source === ALL || d.source === source) &&
        (!q || [d.name, d.description, d.kind, ...d.languages].join(" ").toLowerCase().includes(q)),
    );
  }, [query, kind, language, source]);

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-12">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search datasets..."
            label="Search datasets"
            className="lg:max-w-md"
          />
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <FilterSelect
              label="Language"
              value={language}
              onChange={setLanguage}
              options={[{ value: ALL, label: "All languages" }, ...languages.map((l) => ({ value: l, label: l }))]}
            />
            <FilterSelect
              label="Availability"
              value={source}
              onChange={setSource}
              options={[{ value: ALL, label: "Anywhere" }, ...sources.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        </div>
        <FilterChips
          label="Data type"
          value={kind}
          onChange={setKind}
          chips={[{ id: ALL, label: "All" }, ...kinds.map((k) => ({ id: k, label: k }))]}
        />
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((d, i) => (
            <li key={d.slug} className="flex">
              <ColorCard
                href={`/datasets/${d.slug}`}
                title={d.name}
                kind={`${d.kind} · ${d.source}`}
                description={d.description}
                cta="View Dataset"
                color={cardColor(i)}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-faint">
          No datasets match these filters yet.
        </p>
      )}
    </div>
  );
}

export { DatasetGrid };
