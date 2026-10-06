"use client";

import { Select } from "@base-ui/react/select";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Chips                                                               */
/* ------------------------------------------------------------------ */

type Chip = { id: string; label: string };

// A single-choice row of small outlined pills. The selected one fills.
function FilterChips({
  chips,
  value,
  onChange,
  label,
  className,
}: {
  chips: Chip[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2.5", className)}>
      {chips.map((chip) => {
        const selected = chip.id === value;
        return (
          <button
            key={chip.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(chip.id)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1 font-mono text-[10px] tracking-wide uppercase transition-colors",
              selected
                ? "border-signal bg-signal text-background"
                : "border-signal/60 text-signal hover:border-signal hover:bg-signal/10",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

// Filters as you type; the button is there for people who expect one.
function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-full border border-signal-deep/50 bg-track/60 pr-1 pl-5 focus-within:border-signal/70",
        className,
      )}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-foreground/80 [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        className="h-8 shrink-0 cursor-pointer rounded-full bg-signal px-4 font-mono text-xs text-background transition-colors hover:bg-signal/85"
      >
        Search
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown filter                                                     */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string };

function Caret({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 8 6" className={cn("h-1.5 w-2 shrink-0", className)} fill="currentColor">
      <path d="M0 0h8L4 6Z" />
    </svg>
  );
}

// A labelled dropdown. Shows its label until something other than the
// first ("all") option is chosen, then shows the choice.
function FilterSelect({
  label,
  options,
  value,
  onChange,
  variant = "text",
  className,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  variant?: "text" | "pill";
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  const showLabel = !current || current.value === options[0]?.value;

  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 font-mono whitespace-nowrap text-signal outline-none transition-colors hover:text-foreground focus-visible:underline",
          variant === "text" && "text-sm",
          variant === "pill" &&
            "rounded-full border border-signal/60 bg-track/60 px-4 py-1 text-[10px] hover:border-signal",
          className,
        )}
      >
        <span>{showLabel ? label : current.label}</span>
        <Caret />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false} sideOffset={8} align="start" className="z-50 outline-none">
          <Select.Popup className="zoom-viewport min-w-44 origin-(--transform-origin) rounded-lg border border-line bg-surface-2 py-1.5 shadow-2xl shadow-black/60 transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Select.List className="max-h-(--available-height) overflow-y-auto">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center justify-between gap-6 px-4 py-2 font-mono text-xs text-foreground/80 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-foreground data-selected:text-signal"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="size-1.5 rounded-full bg-signal" />
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export { Caret, FilterChips, FilterSelect, SearchField };
export type { Chip, Option };
