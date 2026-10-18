import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Arrow } from "@/components/system/arrow";
import { buttonClasses } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

// The mock's card: an outlined panel with its top-left and bottom-right
// corners cut at 45°. The outline is a 1px rim of the outer layer showing
// around the inner one, both clipped to the same shape, so the line follows
// the cuts in every browser. --cut sets the size of the cuts.
const CUT =
  "[clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))]";

type ResourceCardProps = {
  href: string;
  title: string;
  text: string;
  cta: string;
  icon: IconSvgElement;
  /** The one card filled yellow, as the mock draws Datasets. */
  highlight?: boolean;
};

// A card that links to one of the site's resources: the title with its icon
// in the corner, a line on what it holds, and the action as a button at the
// foot. The whole card is the link.
function ResourceCard({ href, title, text, cta, icon, highlight }: ResourceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 flex-1 p-px transition-colors",
        CUT,
        "[--cut:1.75rem]",
        highlight ? "bg-signal" : "bg-white/35 hover:bg-signal",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          CUT,
          "gap-3 px-7 pt-8 pb-7 sm:px-8",
          highlight ? "bg-signal text-background" : "bg-[#0e0e0e]",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 text-[1.625rem] leading-[1.15] tracking-[-0.01em] text-balance">{title}</h3>
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            aria-hidden
            className={cn("size-8 shrink-0", highlight ? "text-background" : "text-signal")}
          />
        </div>
        <p className={cn("max-w-sm text-sm text-pretty", highlight ? "text-background" : "text-faint")}>{text}</p>
        <div className="mt-auto pt-8">
          <span className={buttonClasses(highlight ? "ink" : "cream", "h-8 px-4 [--chamfer:6px]")}>{cta}</span>
        </div>
      </div>
    </Link>
  );
}

// A full-width row that leads to a guide: the title in yellow, a monospaced
// line on what it covers, and the arrow at the right over a fine grid.
function QuickstartRow({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="group relative isolate flex items-center justify-between gap-6 overflow-hidden rounded-md border border-line bg-[#0b0b0b] px-6 py-8 transition-colors hover:border-signal/60 sm:px-11 sm:py-10"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid [--grid-line:rgb(255_255_255/0.06)] mask-[radial-gradient(260px_130px_at_100%_50%,#000,rgb(0_0_0/0.4)_45%,transparent)]"
      />
      <div className="flex min-w-0 flex-col gap-4">
        <h3 className="text-xl leading-tight tracking-[-0.01em] text-signal sm:text-[1.5rem]">{title}</h3>
        <p className="font-mono text-xs text-pretty text-subtle sm:text-[0.8125rem]">{text}</p>
      </div>
      <Arrow className="size-6 text-signal transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export { QuickstartRow, ResourceCard };
