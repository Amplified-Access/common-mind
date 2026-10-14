"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BarChart } from "@/components/benchmarks/bar-chart";
import type { BenchmarkEntry } from "@/components/benchmarks/data";
import { workedExamples } from "@/components/civic/data";
import { FRAME, FRAME_PANELS, HALO } from "@/components/system/framed-card";
import { DirectionLabel, Segmented } from "@/components/system/segmented";
import { cn } from "@/lib/utils";

import { Funnel, type Outcome } from "./funnel";
import { PIPELINE_STAGES, StageReveal } from "./pipeline-stage";

export type ShowcaseSet = {
  id: string;
  from: string;
  to: string;
  model: { slug: string; name: string; tagline: string; platforms: string[]; overview: string };
  entries: BenchmarkEntry[];
  evalSet: string;
};

type DeckCard =
  | { kind: "stage"; id: string; label: React.ReactNode; stages: number[]; dwell: number }
  | { kind: "funnel"; id: string; label: React.ReactNode; dwell: number }
  | { kind: "model"; id: string; label: React.ReactNode; set: ShowcaseSet; dwell: number };

// How long each card stays in front before the next comes up: each pipeline
// stage on it long enough to read its output, the funnel long enough to flip
// through every outcome, a model long enough to read it and scan its chart.
const STAGE_DWELL_MS = 2800;
const FUNNEL_DWELL_MS = 6200;
const MODEL_DWELL_MS = 6000;

// The pipeline's stages as cards: transcript and translation share one,
// the translation revealed under the transcript it comes from.
const STAGE_GROUPS = [[0], [1, 2], [3]];

// "Transcription & translation": the group's stage names, joined.
const groupLabel = (stages: number[]) =>
  stages
    .map((stage, i) => (i === 0 ? PIPELINE_STAGES[stage] : PIPELINE_STAGES[stage].toLowerCase()))
    .join(" & ");
// Layers drawn in the stack; cards further back wait out of sight.
const STACK_LAYERS = 3;
// Each layer back sits this much higher and smaller, peeking over the one in front.
const STEP_Y = 14;
const STEP_SCALE = 0.04;

// A framed card with two flush panels: about a third of the width on the
// left, the rest on the right.
const CARD = cn("relative col-start-1 row-start-1 flex", FRAME);
const PANELS = cn("grid flex-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]", FRAME_PANELS);
const LEFT_PANEL = "bg-surface-warm";
const RIGHT_PANEL = "bg-[#0b0a07]";

// The hero's proof on a stack of cards: every layer of the platform
// funnelling into CommonMind, then the civic speech pipeline a stage at a
// time, then the models and how they measure up. The deck cycles on its own while it
// is on screen and nobody is hovering or focused inside it; the row of
// labels above it brings any card to the front.
function HeroDeck({
  sets,
  outcomes,
  className,
}: {
  sets: ShowcaseSet[];
  outcomes: Outcome[];
  className?: string;
}) {
  const cards = useMemo<DeckCard[]>(
    () => [
      { kind: "funnel", id: "commonmind", label: "CommonMind", dwell: FUNNEL_DWELL_MS },
      ...STAGE_GROUPS.map((stages) => ({
        kind: "stage" as const,
        id: `stage-${stages.join("-")}`,
        label: groupLabel(stages),
        stages,
        dwell: STAGE_DWELL_MS * stages.length,
      })),
      ...sets.map((set) => ({
        kind: "model" as const,
        id: set.id,
        label: <DirectionLabel from={set.from} to={set.to} />,
        set,
        dwell: MODEL_DWELL_MS,
      })),
    ],
    [sets],
  );

  const [active, setActive] = useState(cards[0].id);
  // Rounds of the deck: each one walks a new sentence through the pipeline.
  const [round, setRound] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  const playing = inView && !hovering && !focused && !reduce;
  const activeIndex = cards.findIndex((c) => c.id === active);
  const example = workedExamples[round % workedExamples.length];

  // Restarts whenever the front card changes, so a manual pick gets a full dwell.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % cards.length;
      if (next === 0) setRound((r) => r + 1);
      setActive(cards[next].id);
    }, cards[activeIndex].dwell);
    return () => clearTimeout(timer);
  }, [playing, activeIndex, cards]);

  const modelItems = sets.map((s) => ({ id: s.id, label: <DirectionLabel from={s.from} to={s.to} /> }));

  return (
    <div
      ref={ref}
      className={cn("mx-auto flex w-full flex-col gap-4 xl:w-[90%]", className)}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <ol aria-label="Showcase" className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-xs">
        {cards.map((card) => {
          const current = card.id === active;
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-pressed={current}
                onClick={() => setActive(card.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 transition-colors",
                  current ? "text-foreground" : "text-faint hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors duration-500",
                    current ? "bg-signal" : "bg-white/20",
                  )}
                />
                {card.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="relative isolate grid pt-8">
        {/* A soft yellow halo around the whole stack. */}
        <div aria-hidden className={cn(HALO, "inset-x-0 top-8 bottom-0")} />

        {cards.map((card, i) => {
          // How far back the card sits: the next one up is right behind.
          const depth = (i - activeIndex + cards.length) % cards.length;
          const front = depth === 0;
          const shown = Math.min(depth, STACK_LAYERS - 1);
          return (
            <motion.div
              key={card.id}
              inert={!front}
              initial={false}
              animate={{
                scale: 1 - shown * STEP_SCALE,
                y: front ? [null, 40, 0] : shown * -STEP_Y,
                opacity: depth < STACK_LAYERS ? 1 : 0,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      default: { type: "spring", bounce: 0.3, duration: 0.6 },
                      y: front ? { duration: 0.6, times: [0, 0.4, 1], ease: "easeOut" } : { type: "spring", bounce: 0.3, duration: 0.6 },
                      opacity: { duration: 0.3 },
                    }
              }
              style={{ zIndex: cards.length - depth, originY: 0 }}
              className={CARD}
            >
              <div className={PANELS}>
                {card.kind === "stage" && (
                  <StageCard
                    // Starts over each time it comes to the front.
                    key={front ? `front-${round}` : "back"}
                    stages={card.stages}
                    example={example}
                    front={front}
                  />
                )}
                {card.kind === "funnel" && (
                  <div className={cn(RIGHT_PANEL, "lg:col-span-2")}>
                    <Funnel outcomes={outcomes} playing={front} />
                  </div>
                )}
                {card.kind === "model" && (
                  <ModelCard set={card.set} front={front} items={modelItems} onPick={setActive} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// One or more stages of the pipeline: where they sit among the four on the
// left, what they produce on the right. While the card is in front its
// stages reveal one after another, each under the last; reduced motion
// shows them all at once.
function StageCard({
  stages,
  example,
  front,
}: {
  stages: number[];
  example: (typeof workedExamples)[number];
  front: boolean;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const shown = reduce ? stages.length : step + 1;
  const current = stages[shown - 1];

  useEffect(() => {
    if (!front || reduce || step >= stages.length - 1) return;
    const timer = setTimeout(() => setStep((s) => s + 1), STAGE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [front, reduce, step, stages.length]);

  return (
    <>
      <div className={cn(LEFT_PANEL, "flex flex-col gap-5 px-5 py-8 sm:px-6")}>
        <span className="font-mono text-xs text-faint">
          {String(current + 1).padStart(2, "0")} / {String(PIPELINE_STAGES.length).padStart(2, "0")}
        </span>
        <span className="text-[1.75rem] leading-tight tracking-[-0.01em]">{groupLabel(stages)}</span>
        <ol className="flex flex-col gap-2.5 pt-2 text-xs">
          {PIPELINE_STAGES.map((label, i) => (
            <li
              key={label}
              className={cn("flex items-center gap-2 transition-colors duration-500", i === current ? "text-foreground" : "text-faint")}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-500",
                  i === current ? "bg-signal" : i < current ? "bg-white/40" : "bg-white/12",
                )}
              />
              {label}
            </li>
          ))}
        </ol>
        <p className="mt-auto text-[11px] text-faint">Sentence and reference: Sunbird SALT</p>
      </div>
      <div className={cn(RIGHT_PANEL, "flex flex-col items-center justify-center gap-3 px-5 py-8 sm:px-10 sm:py-12")}>
        {/* Stages still to come hold their space, so nothing shifts when
            they reveal. */}
        {stages.map((stage, i) =>
          i < shown ? (
            <StageReveal key={`${stage}-shown`} stage={stage} example={example} />
          ) : (
            <div key={`${stage}-waiting`} aria-hidden className="invisible flex w-full justify-center">
              <StageReveal stage={stage} example={example} />
            </div>
          ),
        )}
      </div>
    </>
  );
}

// A model and how it measures up: the model on the left, its scores on the
// right, with a toggle between the models' translation directions.
function ModelCard({
  set,
  front,
  items,
  onPick,
}: {
  set: ShowcaseSet;
  front: boolean;
  items: { id: string; label: React.ReactNode }[];
  onPick: (id: string) => void;
}) {
  return (
    <>
      <div className={cn(LEFT_PANEL, "flex flex-col gap-5 px-5 py-8 sm:px-6")}>
        <Link href={`/models/${set.model.slug}`} className="text-[1.75rem] leading-tight tracking-[-0.01em] transition-colors hover:text-signal">
          {set.model.name}
        </Link>
        <p className="max-w-60 text-xs">{set.model.tagline}</p>
        <ul className="flex flex-wrap gap-2">
          {set.model.platforms.map((p) => (
            <li key={p} className="rounded-inset border border-line-strong px-1.5 py-0.5 text-[10px] text-foreground/85">
              {p}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 pt-2">
          <span className="text-xs font-medium">Overview</span>
          <p className="max-w-72 text-[11px] leading-relaxed text-faint">{set.model.overview}</p>
        </div>
      </div>

      <div className={cn(RIGHT_PANEL, "flex min-w-0 flex-col gap-10 px-5 py-8 sm:px-10 sm:py-12 xl:pr-16 xl:pl-20")}>
        <Segmented label="Translation direction" value={set.id} onChange={onPick} items={items} className="self-start" />
        {/* Remounts on reaching the front, so the bars grow in again. */}
        <BarChart key={front ? "front" : "back"} title="BLEU" entries={set.entries} metric="bleu" />
        <p className="font-mono text-[11px] text-faint">{set.evalSet}</p>
      </div>
    </>
  );
}

export { HeroDeck };
