"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { Container } from "../common/container";

// The box settles at this scale, so the gap it reveals on either side is
// exactly (1 - BOX_SCALE) of the container's width.
const BOX_SCALE = 0.55;
const GAP_WIDTH = `${(1 - BOX_SCALE) * 100}%`;

type SideContentProps = {
  align: "left" | "right";
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

function SideContent({
  align,
  opacity,
  y,
  eyebrow,
  heading,
  description,
  ctaLabel,
  ctaHref,
}: SideContentProps) {
  const isLeft = align === "left";

  return (
    <motion.div
      style={{ opacity, y, width: GAP_WIDTH }}
      className={`absolute inset-y-0 flex flex-col items-center justify-center px-6 sm:px-8 ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      <div className="flex max-w-md flex-col items-start gap-4 text-left">
        <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-black sm:text-4xl">
          {heading}
        </h2>
        <p className="text-base text-gray-600">{description}</p>
        <Button
          nativeButton={false}
          render={<Link href={ctaHref} />}
          className="bg-black text-white hover:bg-black/85"
        >
          {ctaLabel} →
        </Button>
      </div>
    </motion.div>
  );
}

const Hero = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Phase 1 (0 – 0.3): shrink + slide right, revealing content on the left.
  // Hold (0.3 – 0.45): pause so the left content can be read.
  // Phase 2 (0.45 – 0.7): slide left at a fixed scale, revealing content on the right.
  // Hold (0.7 – 1): pause so the right content can be read.
  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 1],
    [1, BOX_SCALE, BOX_SCALE],
  );
  const x = useTransform(
    scrollYProgress,
    [0, 0.45, 0.7, 1],
    ["0%", "0%", `-${(1 - BOX_SCALE) * 100}%`, `-${(1 - BOX_SCALE) * 100}%`],
  );

  const leftOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.55],
    [0, 1, 1, 0],
  );
  const leftY = useTransform(scrollYProgress, [0, 0.15], [24, 0]);

  const rightOpacity = useTransform(scrollYProgress, [0.55, 0.7, 1], [0, 1, 1]);
  const rightY = useTransform(scrollYProgress, [0.55, 0.7], [24, 0]);

  return (
    <section ref={targetRef} className="relative h-[500vh] bg-white">
      <div className="sticky top-0 flex h-[max(100vh,100vw)] items-start overflow-hidden sm:h-[max(100vh,56.25vw)]">
        <Container size={"full"}>
          <div className="relative">
            <SideContent
              align="left"
              opacity={leftOpacity}
              y={leftY}
              eyebrow="Models"
              heading="Open models, built for local languages."
              description="From Luganda to Swahili, CommonMind trains and evaluates models grounded in the languages and knowledge of the communities they serve — not translated afterthoughts."
              ctaLabel="Explore models"
              ctaHref="/models"
            />
            <SideContent
              align="right"
              opacity={rightOpacity}
              y={rightY}
              eyebrow="Open data"
              heading="Every dataset, fully open."
              description="Translation pairs, instructions, speech, and evaluation sets — the data behind CommonMind is public, so progress on underserved languages compounds instead of resetting."
              ctaLabel="Browse datasets"
              ctaHref="/datasets"
            />
            <motion.div
              style={{ scale, x }}
              className="flex aspect-square w-full origin-right items-center justify-center rounded-2xl bg-black px-6 text-center sm:aspect-video sm:px-8"
            >
              <div>
                <h1 className="text-4xl text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
                  Building the open foundations for Inclusive AI.
                </h1>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    </section>
  );
};

export default Hero;
