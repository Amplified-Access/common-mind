"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { civicCategories, type InputMedium } from "@/components/civic/data";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const HOLD_MS = 5500;

// The categories of civic speech, each with a worked example: what was said,
// and how CommonMind structures it.
function CivicExplorer() {
  const [active, setActive] = useState(civicCategories[0].id);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const pillId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const current =
    civicCategories.find((c) => c.id === active) ?? civicCategories[0];

  // Advance on a timer. Selecting a category restarts the clock; hovering
  // the explorer holds the current one so it can be read.
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => {
      const i = civicCategories.findIndex((c) => c.id === active);
      setActive(civicCategories[(i + 1) % civicCategories.length].id);
    }, HOLD_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  // Keep the selected pill visible in the horizontal (mobile) trough without
  // scrolling the page itself.
  useEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !button || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: button.offsetLeft - list.clientWidth / 2 + button.clientWidth / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active, reduce]);

  return (
    <div
      className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Segmented control: one trough, one sliding selection */}
      <div
        ref={listRef}
        className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
      >
        <div
          role="tablist"
          aria-label="Civic categories"
          className="inline-flex gap-1 rounded-full border border-line bg-surface p-1 lg:flex lg:flex-col lg:rounded-lg lg:p-1.5"
        >
          {civicCategories.map((category) => {
            const selected = category.id === current.id;
            return (
              <button
                key={category.id}
                data-id={category.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(category.id)}
                className={cn(
                  "relative shrink-0 cursor-pointer rounded-full px-4 py-2 text-left font-mono text-xs whitespace-nowrap transition-colors lg:rounded-md lg:px-4 lg:py-2.5",
                  selected ? "text-background" : "text-subtle hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={pillId}
                    className="absolute inset-0 overflow-hidden rounded-full bg-signal lg:rounded-md"
                    transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
                  >
                    {/* Time until the next category */}
                    {!reduce && (
                      <motion.span
                        key={`${active}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-black/10"
                        initial={{ width: "0%" }}
                        animate={{ width: paused ? "0%" : "100%" }}
                        transition={{ duration: paused ? 0 : HOLD_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </motion.span>
                )}
                <span className="relative">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
        >
          {/* What was said */}
          <div className="relative flex min-h-80 flex-col justify-end overflow-hidden rounded-lg border border-line bg-surface sm:min-h-96">
            {current.image ? (
              <>
                <Image
                  src={current.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-x-0 top-0 bottom-28 flex items-center justify-center px-8 sm:bottom-32">
                <Artifact medium={current.medium} />
              </div>
            )}
            <div className="relative flex flex-col gap-3 p-8">
              <span className="font-mono text-xs text-signal">{current.input.kind}</span>
              <p className="max-w-lg text-xl tracking-tight text-pretty sm:text-2xl">
                {current.input.text}
              </p>
            </div>
          </div>

          {/* How it is structured */}
          <div className="flex flex-col justify-between gap-8 rounded-lg border border-line bg-surface p-8">
            <dl className="flex flex-col gap-5 font-mono text-sm">
              {current.output.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <dt className="text-signal">{key}</dt>
                  <dd className="text-foreground/90">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-faint">{current.boundary}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const BARS = 40;
const bars = Array.from({ length: BARS }, (_, i) => {
  const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  const envelope = Math.sin((i / (BARS - 1)) * Math.PI);
  // Rounded so the server and browser render identical heights.
  return Math.round((0.2 + (0.35 + v * 0.45) * envelope) * 1e4) / 1e4;
});

// A drawing of the input itself, used until a photograph is supplied.
function Artifact({ medium }: { medium: InputMedium }) {
  if (medium === "voice") {
    return (
      <div className="flex w-full max-w-md items-center gap-4 rounded-full bg-white/6 py-4 pr-6 pl-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-signal">
          <span className="ml-0.5 size-0 border-y-[7px] border-l-11 border-y-transparent border-l-background" />
        </span>
        <span className="flex h-12 flex-1 items-center gap-0.75" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-full rounded-full bg-foreground/60"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </span>
      </div>
    );
  }

  if (medium === "meeting") {
    const turns = [
      { speaker: "Speaker 1", spans: [[0, 22], [48, 64]] },
      { speaker: "Speaker 2", spans: [[24, 46]] },
      { speaker: "Speaker 3", spans: [[66, 96]] },
    ];
    return (
      <div className="flex w-full max-w-md flex-col gap-4" aria-hidden>
        {turns.map((t, i) => (
          <div key={t.speaker} className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-xs text-faint">{t.speaker}</span>
            <span className="relative h-3 flex-1 rounded-full bg-white/5">
              {t.spans.map(([a, b]) => (
                <span
                  key={a}
                  className={cn(
                    "absolute inset-y-0 rounded-full",
                    i === 0 ? "bg-signal" : "bg-white/35",
                  )}
                  style={{ left: `${a}%`, width: `${b - a}%` }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (medium === "reports") {
    return (
      <div className="relative h-36 w-full max-w-sm" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-x-0 flex flex-col gap-2 rounded-3xl rounded-bl-md bg-white/6 px-6 py-5"
            style={{
              top: `${i * 22}px`,
              transform: `scale(${1 - (2 - i) * 0.05})`,
              opacity: 0.45 + i * 0.27,
            }}
          >
            <span className="h-2 w-3/4 rounded-full bg-white/25" />
            <span className="h-2 w-1/2 rounded-full bg-white/15" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5 rounded-3xl rounded-bl-md bg-white/6 px-6 py-5" aria-hidden>
      <span className="h-2 w-5/6 rounded-full bg-white/25" />
      <span className="h-2 w-full rounded-full bg-white/20" />
      <span className="h-2 w-2/3 rounded-full bg-white/15" />
    </div>
  );
}

export { CivicExplorer };
