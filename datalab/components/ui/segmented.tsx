"use client";

import { cn } from "@/lib/utils";

/** A pill of mutually exclusive options. */
function Segmented({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "h-9 cursor-pointer rounded-full px-4 font-mono text-xs transition-colors",
            value === item.id ? "bg-foreground text-background" : "text-subtle hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export { Segmented };
