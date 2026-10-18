import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Arrow } from "@/components/system/arrow";
import { FRAME, FRAME_PANELS } from "@/components/system/framed-card";
import { buttonClasses } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

type ResourceCardProps = {
  href: string;
  title: string;
  text: string;
  cta: string;
  icon: IconSvgElement;
  /** "lead": the overview's large cards. "task": the smaller grid of things to build. */
  size?: "lead" | "task";
  /** The one card lit yellow, as the mock draws Datasets. */
  highlight?: boolean;
};

// A framed card that links to one of the site's resources: the title with
// its icon beside it, a line on what it holds, and the action as a button
// at the foot. The whole card is the link.
function ResourceCard({ href, title, text, cta, icon, size = "lead", highlight }: ResourceCardProps) {
  const lead = size === "lead";
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-1 transition-colors",
        FRAME,
        highlight ? "border-signal/60" : "hover:border-signal/60",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          FRAME_PANELS,
          lead ? "gap-4 p-6 sm:p-8" : "gap-3 p-5 sm:p-6",
          highlight ? "bg-signal text-background" : "bg-surface-warm",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h3
            className={cn(
              "text-balance tracking-[-0.01em]",
              lead ? "text-[1.75rem] leading-tight" : "text-xl leading-tight",
              !highlight && "transition-colors group-hover:text-signal",
            )}
          >
            {title}
          </h3>
          <HugeiconsIcon
            icon={icon}
            strokeWidth={1.75}
            aria-hidden
            className={cn("shrink-0", lead ? "size-7" : "size-5", highlight ? "text-background" : "text-signal")}
          />
        </div>
        <p className={cn("max-w-md text-sm text-pretty", highlight ? "text-background/80" : "text-subtle")}>
          {text}
        </p>
        <div className={cn("mt-auto", lead ? "pt-6" : "pt-3")}>
          <span className={buttonClasses(highlight ? "ink" : "cream", "h-8 px-4")}>{cta}</span>
        </div>
      </div>
    </Link>
  );
}

// A full-width row that leads to a guide: the title in yellow, a monospaced
// line on what it covers, and the arrow at the right on a fine grid.
function QuickstartRow({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className={cn("group flex transition-colors hover:border-signal/60", FRAME)}>
      <div
        className={cn(
          "relative isolate flex min-w-0 flex-1 items-center justify-between gap-6 bg-[#0b0a07] px-6 py-7 sm:px-10 sm:py-9",
          FRAME_PANELS,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid [--grid-line:rgb(255_255_255/0.07)] mask-[radial-gradient(220px_100px_at_100%_50%,#000,rgb(0_0_0/0.4)_45%,transparent)]"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="text-xl leading-tight tracking-[-0.01em] text-signal sm:text-[1.5rem]">{title}</h3>
          <p className="font-mono text-xs text-pretty text-subtle">{text}</p>
        </div>
        <Arrow className="size-6 text-signal transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

export { QuickstartRow, ResourceCard };
