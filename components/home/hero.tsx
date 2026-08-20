"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Container } from "../common/container";

const Hero = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.55]);

  return (
    <section ref={targetRef} className="relative h-[250vh] bg-white">
      <div className="sticky top-0 flex h-[max(100vh,100vw)] items-start overflow-hidden sm:h-[max(100vh,56.25vw)]">
        <Container size={"full"}>
          <motion.div
            style={{ scale }}
            className="flex aspect-square w-full origin-right items-center justify-center rounded-2xl bg-black px-6 text-center sm:aspect-video sm:px-8"
          >
            <div>
              <h1 className="text-4xl text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
                Building the open foundations for Inclusive AI.
              </h1>
            </div>
          </motion.div>
        </Container>
      </div>
    </section>
  );
};

export default Hero;
