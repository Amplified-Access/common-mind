"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Milliseconds per letter typed and deleted, and how long a full name holds.
const TYPE_MS = 110;
const DELETE_MS = 55;
const HOLD_MS = 1600;
// The pause on an empty line before the next name starts.
const GAP_MS = 350;
// With reduced motion, names swap whole at this interval.
const SWAP_MS = 2400;

// One name at a time, typed out letter by letter, held, deleted, then the
// next: a typewriter with a blinking caret. Letters are counted as the eye
// sees them, so scripts that stack marks, like Ethiopic or Gurmukhi, never
// show half a letter, and each name takes its own direction. It runs only
// while on screen; reduced motion swaps whole names instead. Screen readers
// get the full list once.
function LanguageTypewriter({ names, className }: { names: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const letters = useMemo(() => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return names.map((n) => Array.from(segmenter.segment(n), (s) => s.segment));
  }, [names]);
  const name = letters[index];

  useEffect(() => {
    if (!inView) return;
    let delay: number;
    let step: () => void;
    if (reduce) {
      delay = SWAP_MS;
      step = () => setIndex((i) => (i + 1) % names.length);
    } else if (!deleting && length < name.length) {
      delay = TYPE_MS;
      step = () => setLength((l) => l + 1);
    } else if (!deleting) {
      delay = HOLD_MS;
      step = () => setDeleting(true);
    } else if (length > 0) {
      delay = DELETE_MS;
      step = () => setLength((l) => l - 1);
    } else {
      delay = GAP_MS;
      step = () => {
        setDeleting(false);
        setIndex((i) => (i + 1) % names.length);
      };
    }
    const timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [inView, reduce, deleting, length, name.length, names.length]);

  return (
    <div ref={ref} className={cn("flex items-center", className)}>
      <span className="sr-only">{names.join(", ")}</span>
      <span aria-hidden className="flex items-center whitespace-nowrap">
        <span dir="auto">{(reduce ? name : name.slice(0, length)).join("")}</span>
        <span className="ml-1 inline-block h-[1.1em] w-0.5 animate-[cm-caret_1s_steps(1)_infinite] bg-foreground motion-reduce:hidden" />
      </span>
      <style>{`@keyframes cm-caret { 50% { opacity: 0 } }`}</style>
    </div>
  );
}

export { LanguageTypewriter };
