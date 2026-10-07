"use client";

import { useState } from "react";

import { BarChart } from "@/components/benchmarks/bar-chart";
import type { BenchmarkEntry } from "@/components/benchmarks/data";
import { FramedCard, HALO } from "@/components/system/framed-card";
import { DirectionLabel, Segmented } from "@/components/system/segmented";
import { cn } from "@/lib/utils";

type BenchSet = { id: string; from: string; to: string; entries: BenchmarkEntry[]; evalSet: string };

// Two leaderboards, one behind the other: the one in front is live, the
// one behind is the other direction, dimmed.
function BenchShowcase({ sets }: { sets: BenchSet[] }) {
  const [active, setActive] = useState(sets[0].id);
  const front = sets.find((s) => s.id === active) ?? sets[0];
  const back = sets.find((s) => s.id !== front.id) ?? front;

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <FramedCard
        aria-hidden
        className="pointer-events-none hidden opacity-40 mask-[linear-gradient(to_right,transparent,#000_40%)] lg:mt-14 lg:flex"
        panelsClassName="flex flex-col gap-8 bg-[#0b0a07] p-10"
      >
        <span className="text-h2">CivicBench Africa</span>
        <BarChart title="BLEU" entries={back.entries} metric="bleu" />
      </FramedCard>
      <div className="relative isolate min-w-0 lg:-ml-10">
        <div aria-hidden className={cn(HALO, "inset-0")} />
        <FramedCard panelsClassName="flex flex-col gap-7 bg-[#0b0a07] p-7 sm:p-10">
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
        </FramedCard>
      </div>
    </div>
  );
}

export { BenchShowcase };
