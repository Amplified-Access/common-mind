"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

// The theme lives on <html class="dark">, set before paint by the layout's
// script; the toggle flips it and remembers the choice.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private windows may refuse storage; the theme still changes for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "chamfer flex size-10 shrink-0 cursor-pointer items-center justify-center border border-line-strong text-foreground transition-colors hover:border-foreground",
        className,
      )}
    >
      <HugeiconsIcon icon={dark ? Sun03Icon : Moon02Icon} strokeWidth={1.5} className="size-4.5" />
    </button>
  );
}

export { ThemeToggle };
