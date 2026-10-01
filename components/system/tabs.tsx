"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  className?: string;
  initial?: string;
};

// Segmented tabs on a single soft track. Scrolls horizontally on narrow
// screens rather than wrapping.
function Tabs({ items, className, initial }: TabsProps) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const layoutId = useId();
  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="inline-flex gap-1 rounded-full bg-surface p-1">
          {items.map((item) => {
            const selected = item.id === current?.id;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setActive(item.id)}
                className={cn(
                  "relative shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors",
                  selected ? "text-background" : "text-subtle hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}

export { Tabs };
export type { TabItem };
