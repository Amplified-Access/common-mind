import { cn } from "@/lib/utils";

// Shared control styles: the main site's shapes in black and white.

export const fieldClasses =
  "w-full rounded-inset border border-line bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground";

const button =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 px-5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50";

// Filled and outlined buttons take the cut corners; the quiet one has no
// edge to shape.
export const primaryButton = cn(button, "chamfer bg-foreground text-background hover:bg-foreground/80");

export const secondaryButton = cn(button, "chamfer border border-line-strong text-foreground hover:border-foreground");

export const quietButton = cn(button, "rounded-full text-subtle hover:text-foreground");
