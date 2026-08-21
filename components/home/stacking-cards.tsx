"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

type CardData = {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

const CARDS: CardData[] = [
  {
    eyebrow: "Benchmarks",
    heading: "Measure what improves.",
    description:
      "See how CommonMind models perform, how they compare with base models, and where they still need to improve.",
    ctaLabel: "Compare models",
    ctaHref: "/benchmarks",
    image: "/flat-lay-statistics-presentation-with-chart.jpg",
  },
  {
    eyebrow: "Playground",
    heading: "Try AI in your language.",
    description:
      "Choose a model, enter something, and experience CommonMind directly in your browser.",
    ctaLabel: "Start experimenting",
    ctaHref: "/playground",
    image: "/man-speaking-into-his-smartphone-s-speaker.jpg",
  },
  {
    eyebrow: "Build",
    heading: "Build with CommonMind.",
    description:
      "Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments.",
    ctaLabel: "Get started",
    ctaHref: "/build",
    image: "/close-up-man-repairing-computer-chips.jpg",
  },
  {
    eyebrow: "Research",
    heading: "Researching AI from where people are.",
    description:
      "Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems.",
    ctaLabel: "Read the research",
    ctaHref: "/research",
    image: "/working-from-home-ergonomic-workstation.jpg",
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

function CardBackground({ data }: { data: CardData }) {
  return (
    <>
      <Image
        src={data.image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
    </>
  );
}

// The base card sits in place from the start (no slide-in, nothing behind
// it) — it's what continues straight off the Hero's final frame, so there's
// no separate blank layer before it.
function BaseCard({ data }: { data: CardData }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-8 py-12 text-center text-white sm:px-16">
      <CardBackground data={data} />
      <div className="relative flex flex-col items-center gap-4">
        <CardContent data={data} />
      </div>
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
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-8 py-12 text-center text-white sm:px-16"
    >
      <CardBackground data={data} />
      <div className="relative flex flex-col items-center gap-4">
        <CardContent data={data} />
      </div>
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
    <section ref={targetRef} className="relative h-[400vh] bg-[#f4f4f4]">
      <div className="sticky top-0 h-screen p-4">
        <div className="relative h-full overflow-hidden">
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
