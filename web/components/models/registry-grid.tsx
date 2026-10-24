"use client";

import { useMemo, useState } from "react";

import { FilterSelect, SearchField } from "@/components/system/filters";

import type { CatalogEntry } from "./catalog";
import { ModelCard } from "./model-card";
import type { TaskId } from "./registry";

type RegistryGridProps = {
  entries: CatalogEntry[];
  tasks: { id: TaskId; label: string }[];
};

const ALL = "all";

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "bleu", label: "Highest BLEU" },
  { value: "name", label: "Name" },
];

const unique = (values: string[]) => Array.from(new Set(values)).sort();

// The registry: search, filter and sort the released models.
function RegistryGrid({ entries, tasks }: RegistryGridProps) {
  const [query, setQuery] = useState("");
  const [task, setTask] = useState<string>(ALL);
  const [language, setLanguage] = useState(ALL);
  const [license, setLicense] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [sort, setSort] = useState("newest");

  const options = useMemo(
    () => ({
      languages: unique(entries.flatMap((e) => e.languages)),
      licenses: unique(entries.map((e) => e.license)),
      availability: unique(entries.flatMap((e) => e.availability)),
    }),
    [entries],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = entries.filter(
      (e) =>
        (task === ALL || e.task === task) &&
        (language === ALL || e.languages.includes(language)) &&
        (license === ALL || e.license === license) &&
        (availability === ALL || e.availability.includes(availability)) &&
        (!q ||
          [e.name, ...e.tags, ...e.fields.map((f) => f.value)]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
    return matches.sort((a, b) => {
      if (sort === "bleu") return b.bleu - a.bleu;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.release.localeCompare(a.release);
    });
  }, [entries, query, task, language, license, availability, sort]);

  return (
    <div className="flex flex-col gap-14">
      {/* One row, as on the languages page: filters on the left, search on the right. */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2.5">
          <FilterSelect
            variant="pill"
            label="Task"
            value={task}
            onChange={setTask}
            options={[{ value: ALL, label: "All tasks" }, ...tasks.map((t) => ({ value: t.id, label: t.label }))]}
          />
          <FilterSelect
            variant="pill"
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[
              { value: ALL, label: "All languages" },
              ...options.languages.map((l) => ({ value: l, label: l })),
            ]}
          />
          <FilterSelect
            variant="pill"
            label="License"
            value={license}
            onChange={setLicense}
            options={[
              { value: ALL, label: "All licenses" },
              ...options.licenses.map((l) => ({ value: l, label: l })),
            ]}
          />
          <FilterSelect
            variant="pill"
            label="Availability"
            value={availability}
            onChange={setAvailability}
            options={[
              { value: ALL, label: "Anywhere" },
              ...options.availability.map((a) => ({ value: a, label: a })),
            ]}
          />
          <FilterSelect variant="pill" label="Sort By" value={sort} onChange={setSort} options={sorts} />
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search Models"
          label="Search models"
          className="lg:max-w-md"
        />
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-5 lg:grid-cols-2">
          {visible.map((entry) => (
            <li key={entry.slug} className="flex">
              <ModelCard model={entry} className="w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center font-mono text-sm text-faint">
          No released models match these filters yet.
        </p>
      )}
    </div>
  );
}

export { RegistryGrid };
