"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  decimals?: number;
  delay?: number;
  className?: string;
};

// Counts from zero to its value once, as it enters the viewport, on the same
// timing as the chart bars.
function CountUp({ value, decimals = 2, delay = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.1,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setCurrent,
    });
    return () => controls.stop();
  }, [inView, reduce, value, delay]);

  return (
    <span ref={ref} className={className}>
      {(reduce ? value : current).toFixed(decimals)}
    </span>
  );
}

export { CountUp };
