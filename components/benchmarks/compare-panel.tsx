"use client";

import { useState } from "react";

import { DirectionLabel, Segmented } from "@/components/system/segmented";

import { BarChart } from "./bar-chart";
import type { LanguageBenchmark } from "./data";

type CompareSet = {
  id: string;
  from: string;
  to: string;
  /** Head-to-head results, scored on one shared set. */
  primary: LanguageBenchmark;
  /** Published references on a different set, shown for context only. */
  references?: LanguageBenchmark;
};

// BLEU and chrF++ side by side for one translation direction at a time.
function ComparePanel({ sets }: { sets: CompareSet[] }) {
  const [active, setActive] = useState(sets[0].id);
  const set = sets.find((s) => s.id === active) ?? sets[0];

  return (
    <div className="flex flex-col gap-12">
      <Segmented
        label="Translation direction"
        value={set.id}
        onChange={setActive}
        items={sets.map((s) => ({ id: s.id, label: <DirectionLabel from={s.from} to={s.to} /> }))}
        className="self-start"
      />
      <div className="flex flex-col gap-6">
        <div className="grid gap-14 xl:grid-cols-2 xl:gap-16">
          <BarChart title="BLEU" entries={set.primary.entries} metric="bleu" />
          <BarChart title="chrF++" entries={set.primary.entries} metric="chrf" />
        </div>
        <p className="font-mono text-xs text-faint">{set.primary.evalSet}</p>
      </div>
      {set.references && (
        <div className="flex flex-col gap-6 border-t border-line pt-12">
          <div className="grid gap-14 xl:grid-cols-2 xl:gap-16">
            <BarChart title="BLEU · published references" entries={set.references.entries} metric="bleu" />
            <BarChart title="chrF++ · published references" entries={set.references.entries} metric="chrf" />
          </div>
          <p className="font-mono text-xs text-faint">
            {set.references.evalSet}. {set.references.note}
          </p>
        </div>
      )}
    </div>
  );
}

export { ComparePanel };
export type { CompareSet };
