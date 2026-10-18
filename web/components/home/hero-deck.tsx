"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { workedExamples } from "@/components/civic/data";
import { FRAME, FRAME_PANELS, HALO } from "@/components/system/framed-card";
import { cn } from "@/lib/utils";

import { Funnel, type Outcome } from "./funnel";
import { PIPELINE_STAGES, StageReveal } from "./pipeline-stage";

type DeckCard =
  | { kind: "stage"; id: string; label: React.ReactNode; stages: number[]; dwell: number }
  | { kind: "funnel"; id: string; label: React.ReactNode; dwell: number };

// How long each card stays in front before the next comes up: each pipeline
// stage on it long enough to read its output, the funnel long enough to flip
// through every outcome.
const STAGE_DWELL_MS = 2800;
const FUNNEL_DWELL_MS = 6200;

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
// time. The deck cycles on its own while it is on screen and nobody is
// hovering or focused inside it; the row of labels above it brings any card
// to the front.
function HeroDeck({ outcomes, className }: { outcomes: Outcome[]; className?: string }) {
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
    ],
    [],
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

export { HeroDeck };
