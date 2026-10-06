"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

type SegmentedItem = {
  id: string;
  label: React.ReactNode;
};

type SegmentedProps = {
  items: SegmentedItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
};

// One dark track with a yellow selection that slides between options.
function Segmented({ items, value, onChange, label, className }: SegmentedProps) {
  const layoutId = useId();
  const reduce = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto scrollbar-none rounded-full border border-signal-deep/40 bg-track/70 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={items.length === 1}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-xs whitespace-nowrap transition-colors disabled:cursor-default",
              selected ? "text-background" : "text-foreground hover:text-signal",
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-signal"
                transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// "English ⟶ Swahili", with a drawn arrow so it keeps its length.
function DirectionLabel({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {from}
      <svg aria-hidden viewBox="0 0 22 8" className="h-2 w-5.5 shrink-0" fill="currentColor">
        <rect x="0" y="3.4" width="18" height="1.2" />
        <path d="M16 0 22 4 16 8Z" />
      </svg>
      <span className="sr-only">to</span>
      {to}
    </span>
  );
}

export { DirectionLabel, Segmented };
export type { SegmentedItem };
