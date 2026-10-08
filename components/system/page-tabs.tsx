"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { Container } from "@/components/common/container";
import { cn } from "@/lib/utils";

type PageTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

// Full-width tabs between a page's hero and its body. The selected tab is
// mirrored in the URL hash, so a tab can be linked to directly.
function PageTabs({ tabs, className }: { tabs: PageTab[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const layoutId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={className}>
      <div className="zoom-viewport border-b border-line">
        <Container className="scrollbar-none overflow-x-auto px-0 md:px-0 xl:px-12">
          <div role="tablist" aria-label="Sections" className="flex min-w-max border-l border-line">
            {tabs.map((tab) => {
              const selected = tab.id === current?.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => select(tab.id)}
                  className={cn(
                    "relative flex-1 cursor-pointer border-r border-line px-6 py-5 font-mono text-base tracking-wide whitespace-nowrap uppercase transition-colors sm:px-10 sm:text-lg",
                    selected ? "text-signal" : "text-foreground hover:text-signal",
                  )}
                >
                  {tab.label}
                  {selected && (
                    <motion.span
                      layoutId={layoutId}
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-signal"
                      transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Container>
      </div>
      {current && (
        <div
          role="tabpanel"
          id={`panel-${current.id}`}
          aria-labelledby={`tab-${current.id}`}
        >
          {current.content}
        </div>
      )}
    </div>
  );
}

export { PageTabs };
export type { PageTab };
