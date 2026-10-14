"use client";

import { Menu } from "@base-ui/react/menu";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import { useRef } from "react";

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

// Space between the header's bottom edge and the search bar once it's
// brought up, in screen pixels.
const SEARCH_GAP = 16;

// Filters as you type; the button is there for people who expect one. When
// the field gains focus the page glides until the bar sits just under the
// header, so the first results show beneath it as the reader types, even
// with a phone's keyboard taking the lower half of the screen.
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
  const formRef = useRef<HTMLFormElement>(null);
  const lenis = useLenis();

  // Measured from the header itself, so it holds at any zoom.
  const headerBottom = () => document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;

  const bringUp = () => {
    const form = formRef.current;
    if (!form) return;
    const top = headerBottom() + SEARCH_GAP;
    const distance = form.getBoundingClientRect().top - top;
    if (Math.abs(distance) < 4) return;
    const immediate = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis) lenis.scrollTo(form, { offset: -top, duration: 0.8, immediate });
    else window.scrollBy({ top: distance, behavior: immediate ? "instant" : "smooth" });
  };

  return (
    <form
      ref={formRef}
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
        onFocus={bringUp}
        onChange={(e) => {
          onChange(e.target.value);
          // Typing after scrolling the bar out of sight brings it back.
          const rect = formRef.current?.getBoundingClientRect();
          if (rect && (rect.top < headerBottom() || rect.bottom > window.innerHeight)) bringUp();
        }}
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

// A labelled dropdown, as a popover menu of choices. Shows its label until
// something other than the first ("all") option is chosen, then shows the
// choice. Non-modal, so the page keeps its scrollbar and never shifts.
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
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label={showLabel ? label : `${label}: ${current.label}`}
        className={cn(
          "group inline-flex cursor-pointer items-center gap-2 font-mono whitespace-nowrap text-signal outline-none transition-colors hover:text-foreground focus-visible:underline data-popup-open:text-foreground",
          variant === "text" && "text-sm",
          variant === "pill" &&
            "rounded-full border border-signal/60 bg-track/60 px-4 py-1 text-[10px] hover:border-signal",
          className,
        )}
      >
        <span>{showLabel ? label : current.label}</span>
        <Caret className="transition-transform group-data-popup-open:rotate-180" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start" className="z-50 outline-none">
          <Menu.Popup className="zoom-viewport min-w-48 origin-(--transform-origin) rounded-card border border-line bg-surface-2 p-1 shadow-2xl shadow-black/60 outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {/* data-lenis-prevent: a long list scrolls itself, not the page. */}
            <div data-lenis-prevent className="max-h-(--available-height) overflow-y-auto">
              <Menu.RadioGroup
                value={value}
                onValueChange={(next) => {
                  if (typeof next === "string") onChange(next);
                }}
              >
                {options.map((option) => (
                  <Menu.RadioItem
                    key={option.value}
                    value={option.value}
                    closeOnClick
                    className="flex cursor-pointer items-center justify-between gap-6 rounded-inset px-3 py-2 font-mono text-xs text-foreground/75 outline-none select-none data-checked:bg-signal/10 data-checked:text-signal data-highlighted:bg-white/5 data-highlighted:text-foreground data-checked:data-highlighted:bg-signal/15 data-checked:data-highlighted:text-signal"
                  >
                    {option.label}
                    {/* Holds its width when empty, so rows line up. */}
                    <span className="flex size-3.5 shrink-0 items-center justify-center">
                      <Menu.RadioItemIndicator>
                        <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2} />
                      </Menu.RadioItemIndicator>
                    </span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export { Caret, FilterChips, FilterSelect, SearchField };
export type { Chip, Option };
