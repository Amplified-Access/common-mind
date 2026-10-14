"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CodeTab = {
  id: string;
  label: string;
  /** Usually a server-highlighted <Code> block. */
  content: React.ReactNode;
};

// Pill tabs over interchangeable code samples: Python, Hugging Face, Ollama…
function CodeTabs({
  tabs,
  variant = "pill",
  className,
}: {
  tabs: CodeTab[];
  /** "pill": rounded outlined pills. "box": square tags, as on dataset pages. */
  variant?: "pill" | "box";
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div role="tablist" aria-label="Ways to use it" className="flex flex-wrap gap-3 sm:gap-4">
        {tabs.map((tab) => {
          const selected = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={cn(
                "cursor-pointer font-mono text-xs transition-colors",
                variant === "pill" && "rounded-full border px-5 py-2",
                variant === "pill" &&
                  (selected
                    ? "border-signal bg-signal text-background"
                    : "border-signal/70 text-signal hover:bg-signal/10"),
                variant === "box" && "border px-2.5 py-1 text-sm",
                variant === "box" &&
                  (selected
                    ? "border-signal bg-signal text-background"
                    : "border-line-strong bg-tag text-foreground/85 hover:text-signal"),
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}

export { CodeTabs };
export type { CodeTab };
