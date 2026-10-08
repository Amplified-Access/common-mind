"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { terminology } from "./data";

// expression → English → civic concept → context
function TerminologyViewer() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const term = terminology[index];

  const highlight = (sentence: string, expression: string) => {
    const parts = expression.split(" … ");
    const pattern = new RegExp(
      `(${parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "gi",
    );
    return sentence.split(pattern).map((chunk, i) =>
      parts.some((p) => p.toLowerCase() === chunk.toLowerCase()) ? (
        <mark key={i} className="rounded-sm bg-signal px-1 text-background">
          {chunk}
        </mark>
      ) : (
        <span key={i}>{chunk}</span>
      ),
    );
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {terminology.map((t, i) => (
          <li key={t.expression} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "w-full cursor-pointer rounded-full px-4 py-2 text-left font-mono text-sm whitespace-nowrap transition-colors lg:rounded-none lg:px-0 lg:py-1.5",
                i === index
                  ? "bg-signal text-background lg:bg-transparent lg:text-signal"
                  : "bg-surface text-subtle hover:text-foreground lg:bg-transparent lg:text-faint",
              )}
            >
              {t.expression}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait">
        <motion.div
          key={term.expression}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-12"
        >
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-xl sm:text-2xl">
            <span className="text-foreground">{term.expression}</span>
            <span className="text-faint">→</span>
            <span className="text-subtle">{term.english}</span>
            <span className="text-faint">→</span>
            <span className="text-signal">{term.concept}</span>
          </p>

          <div className="flex max-w-2xl flex-col gap-4">
            <p className="font-mono leading-relaxed text-foreground">
              {highlight(term.sentence, term.expression)}
            </p>
            <p className="text-subtle">
              {term.reference} <span className="text-faint">· Sunbird SALT</span>
            </p>
          </div>

          <p className="max-w-2xl text-pretty text-subtle">{term.context}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { TerminologyViewer };
