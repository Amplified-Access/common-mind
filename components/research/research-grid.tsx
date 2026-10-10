"use client";

import { useMemo, useState } from "react";

import { cardColor, ColorCard } from "@/components/system/color-card";
import { FilterChips, FilterSelect, SearchField } from "@/components/system/filters";

import type { ResearchItem } from "./items";

const ALL = "all";
const unique = (values: string[]) => Array.from(new Set(values)).sort();

function ResearchGrid({ items }: { items: ResearchItem[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(ALL);
  const [topic, setTopic] = useState(ALL);
  const [language, setLanguage] = useState(ALL);
  const [year, setYear] = useState(ALL);

  const options = useMemo(
    () => ({
      kinds: unique(items.map((i) => i.kind)),
      topics: unique(items.flatMap((i) => i.topics)),
      languages: unique(items.flatMap((i) => i.languages)),
      years: unique(items.flatMap((i) => (i.date ? [i.date.slice(0, 4)] : []))).reverse(),
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (kind === ALL || i.kind === kind) &&
        (topic === ALL || i.topics.includes(topic)) &&
        (language === ALL || i.languages.includes(language)) &&
        (year === ALL || i.date?.startsWith(year)) &&
        (!q || [i.title, i.description, i.kind, ...i.tags].join(" ").toLowerCase().includes(q)),
    );
  }, [items, query, kind, topic, language, year]);

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col items-center gap-6">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Explore Research"
          label="Explore research"
          className="max-w-md"
        />
        <FilterChips
          label="Kind"
          value={kind}
          onChange={setKind}
          chips={[{ id: ALL, label: "All" }, ...options.kinds.map((k) => ({ id: k, label: k }))]}
          className="justify-center"
        />
        <div className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          <FilterSelect
            label="Topic"
            value={topic}
            onChange={setTopic}
            options={[{ value: ALL, label: "All topics" }, ...options.topics.map((t) => ({ value: t, label: t }))]}
          />
          <FilterSelect
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[{ value: ALL, label: "All languages" }, ...options.languages.map((l) => ({ value: l, label: l }))]}
          />
          <FilterSelect
            label="Year"
            value={year}
            onChange={setYear}
            options={[{ value: ALL, label: "Any year" }, ...options.years.map((y) => ({ value: y, label: y }))]}
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item, i) => (
            <li key={item.id} className="flex">
              <ColorCard
                href={item.href}
                title={item.title}
                kind={item.kind}
                description={item.description}
                tags={item.tags}
                cta={item.cta}
                color={cardColor(i)}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-faint">
          No research matches these filters yet.
        </p>
      )}
    </div>
  );
}

export { ResearchGrid };
