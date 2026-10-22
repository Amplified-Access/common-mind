import { cn } from "@/lib/utils";

// Shared control styles: black and white, every button round.

export const fieldClasses =
  "w-full rounded-inset border border-line bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground";

const button =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButton = cn(button, "bg-foreground text-background hover:bg-foreground/80");

export const secondaryButton = cn(button, "border border-line-strong text-foreground hover:border-foreground");

export const quietButton = cn(button, "text-subtle hover:text-foreground");
