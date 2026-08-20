"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

type CardData = {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  bg: string;
};

const CARDS: CardData[] = [
  {
    eyebrow: "Benchmarks",
    heading: "Measure what improves.",
    description:
      "See how CommonMind models perform, how they compare with base models, and where they still need to improve.",
    ctaLabel: "Compare models",
    ctaHref: "/benchmarks",
    bg: "bg-neutral-700",
  },
  {
    eyebrow: "Playground",
    heading: "Try AI in your language.",
    description:
      "Choose a model, enter something, and experience CommonMind directly in your browser.",
    ctaLabel: "Start experimenting",
    ctaHref: "/playground",
    bg: "bg-amber-700",
  },
  {
    eyebrow: "Build",
    heading: "Build with CommonMind.",
    description:
      "Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments.",
    ctaLabel: "Get started",
    ctaHref: "/build",
    bg: "bg-emerald-700",
  },
  {
    eyebrow: "Research",
    heading: "Researching AI from where people are.",
    description:
      "Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems.",
    ctaLabel: "Read the research",
    ctaHref: "/research",
    bg: "bg-violet-700",
  },
];

function CardContent({ data }: { data: CardData }) {
  return (
    <>
      <span className="text-xs font-medium tracking-widest text-white/60 uppercase">
        {data.eyebrow}
      </span>
      <h3 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        {data.heading}
      </h3>
      <p className="max-w-xl text-base text-white/70 sm:text-lg">
        {data.description}
      </p>
      <div>
        <Button
          nativeButton={false}
          render={<Link href={data.ctaHref} />}
          className="bg-white text-black hover:bg-white/85"
        >
          {data.ctaLabel} →
        </Button>
      </div>
    </>
  );
}

// The base card sits in place from the start (no slide-in, nothing behind
// it) — it's what continues straight off the Hero's final frame, so there's
// no separate blank layer before it.
function BaseCard({ data }: { data: CardData }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col justify-center gap-4 rounded-3xl px-8 py-12 text-white sm:px-16 ${data.bg}`}
    >
      <CardContent data={data} />
    </div>
  );
}

type CardProps = {
  index: number;
  total: number;
  progress: MotionValue<number>;
  data: CardData;
};

function Card({ index, total, progress, data }: CardProps) {
  const segmentStart = index / total;
  const segmentEnd = (index + 1) / total;
  const y = useTransform(progress, [segmentStart, segmentEnd], ["100%", "0%"]);

  return (
    <motion.div
      style={{ y, zIndex: index + 1 }}
      className={`absolute inset-0 flex flex-col justify-center gap-4 rounded-3xl px-8 py-12 text-white sm:px-16 ${data.bg}`}
    >
      <CardContent data={data} />
    </motion.div>
  );
}

const StackingCards = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 h-screen overflow-hidden p-4">
        <div className="relative h-full">
          <BaseCard data={CARDS[0]} />
          {CARDS.slice(1).map((card, index) => (
            <Card
              key={card.eyebrow}
              index={index}
              total={CARDS.length - 1}
              progress={scrollYProgress}
              data={card}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StackingCards;
