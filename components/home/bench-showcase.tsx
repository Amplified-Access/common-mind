"use client";

import { useState } from "react";

import { BarChart } from "@/components/benchmarks/bar-chart";
import type { BenchmarkEntry } from "@/components/benchmarks/data";
import { DirectionLabel, Segmented } from "@/components/system/segmented";

type BenchSet = { id: string; from: string; to: string; entries: BenchmarkEntry[]; evalSet: string };

// Two leaderboards, one behind the other: the one in front is live, the
// one behind is the other direction, dimmed.
function BenchShowcase({ sets }: { sets: BenchSet[] }) {
  const [active, setActive] = useState(sets[0].id);
  const front = sets.find((s) => s.id === active) ?? sets[0];
  const back = sets.find((s) => s.id !== front.id) ?? front;

  return (
    <div className="relative grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <div
        aria-hidden
        className="pointer-events-none hidden flex-col gap-8 rounded-l-lg border border-r-0 border-line bg-surface/60 p-10 opacity-40 mask-[linear-gradient(to_right,transparent,#000_40%)] lg:mt-14 lg:flex"
      >
        <span className="text-h2">CivicBench Africa</span>
        <BarChart title="BLEU" entries={back.entries} metric="bleu" />
      </div>
      <div className="relative flex flex-col gap-7 rounded-lg border border-line bg-surface p-7 shadow-[0_-30px_80px_-30px_rgb(255_211_0/0.25)] sm:p-10 lg:-ml-10">
        <h3 className="text-h2">CivicBench Africa</h3>
        <Segmented
          label="Translation direction"
          value={front.id}
          onChange={setActive}
          items={sets.map((s) => ({ id: s.id, label: <DirectionLabel from={s.from} to={s.to} /> }))}
          className="self-start"
        />
        <p className="font-mono text-xs">
          Task: <span className="text-signal">Translation</span>
        </p>
        <BarChart key={front.id} title="BLEU" entries={front.entries} metric="bleu" />
        <p className="font-mono text-[11px] text-faint">{front.evalSet}</p>
      </div>
    </div>
  );
}

export { BenchShowcase };
