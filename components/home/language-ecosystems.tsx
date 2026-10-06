"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { ArrowLink, StatusDot } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

export type Ecosystem = {
  code: string;
  name: string;
  models: number;
  datasets: number;
  benchmark?: string;
  researchHref?: string;
  description: string;
  /** Code from one of its models, shown as texture. */
  sample?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Pick a language, see everything built around it.
function LanguageEcosystems({ ecosystems }: { ecosystems: Ecosystem[] }) {
  const [active, setActive] = useState(ecosystems[0].code);
  const reduce = useReducedMotion();
  const current = ecosystems.find((e) => e.code === active) ?? ecosystems[0];
  const built = current.models > 0;

  const facts: [string, React.ReactNode][] = [
    ["Models", built ? `${pad(current.models)} available` : "Open for contributors"],
    ["Civic Corpus", current.datasets ? `${pad(current.datasets)} datasets` : "–"],
    ["Benchmarks", current.benchmark ?? "–"],
    [
      "Research",
      current.researchHref ? (
        <Link href={current.researchHref} className="hover:text-foreground">
          View related work
        </Link>
      ) : (
        "–"
      ),
    ],
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
      <div role="tablist" aria-label="Languages" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {ecosystems.map((e) => {
          const selected = e.code === current.code;
          return (
            <button
              key={e.code}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(e.code)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full border px-5 py-2 text-left font-mono text-sm transition-colors",
                selected
                  ? "border-signal text-signal"
                  : "border-transparent pl-10 text-foreground hover:text-signal",
              )}
            >
              {selected && (
                <span aria-hidden className="size-3.5 bg-signal mask-[url(/icon-white.svg)] mask-contain mask-center mask-no-repeat" />
              )}
              {e.name}
            </button>
          );
        })}
        <Link href="/languages" className="shrink-0 px-5 py-2 pl-10 font-mono text-sm hover:text-signal">
          More +
        </Link>
      </div>

      <div className="relative isolate overflow-hidden rounded-lg border border-line bg-[#0b0a07]">
        <div aria-hidden className="absolute inset-x-0 -top-px -z-10 h-24 bg-[radial-gradient(50%_100%_at_30%_0%,rgb(255_211_0/0.14),transparent)]" />
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.code}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-96 flex-col gap-6 bg-surface-warm p-8 sm:p-10"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[2rem] leading-none">{current.name}</span>
                <span className="rounded-full border border-signal/40 bg-track px-2.5 py-0.5">
                  <StatusDot
                    label={built ? "Active" : "Planned"}
                    tone={built ? "signal" : "muted"}
                    className={built ? "text-signal" : undefined}
                  />
                </span>
              </div>
              <dl className="flex flex-col gap-2 font-mono text-xs">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <dt>{label}:</dt>
                    <dd className="text-signal">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="max-w-xs text-xs leading-relaxed text-faint">{current.description}</p>
              <ArrowLink href={`/languages/${current.code}`} className="mt-auto">
                Explore {current.name}
              </ArrowLink>
            </motion.div>
          </AnimatePresence>
          <pre
            aria-hidden
            className="hidden overflow-hidden p-10 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/30 mask-[linear-gradient(to_bottom,#000_50%,transparent)] lg:block"
          >
            {current.sample}
          </pre>
        </div>
      </div>
    </div>
  );
}

export { LanguageEcosystems };
