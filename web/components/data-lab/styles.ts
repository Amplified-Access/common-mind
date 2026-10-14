import { cn } from "@/lib/utils";

// Shared control styles for the Data Lab, matching the Playground's buttons
// and the site's mono labels.

export const fieldClasses =
  "w-full rounded-inset border border-line bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-signal";

const button =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButton = cn(button, "bg-signal text-background hover:bg-signal/85");

export const secondaryButton = cn(button, "border border-line-strong text-foreground hover:border-signal hover:text-signal");

export const quietButton = cn(button, "text-subtle hover:text-foreground");
