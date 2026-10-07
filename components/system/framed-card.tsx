import { cn } from "@/lib/utils";

// The site's card, from the 2026-10 mocks: a hairline-edged olive frame
// around panels that sit flush inside it. Exported as class strings too, for
// cards that need to be a motion element.
const FRAME = "rounded-[3px] border border-[#1e1c19] bg-[#131000] p-1.5 sm:p-2";
const FRAME_PANELS = "overflow-hidden rounded-[2px]";

// A soft yellow glow around a card, drawn by an empty layer behind it.
const HALO = "pointer-events-none absolute -z-10 rounded-[3px] shadow-[0_0_90px_10px_rgb(255_211_0/0.14)]";

type FramedCardProps = React.ComponentProps<"div"> & {
  /** Classes for the inner box that holds the panels (a grid, say). */
  panelsClassName?: string;
};

function FramedCard({ className, panelsClassName, children, ...props }: FramedCardProps) {
  return (
    <div className={cn("flex", FRAME, className)} {...props}>
      <div className={cn("min-w-0 flex-1", FRAME_PANELS, panelsClassName)}>{children}</div>
    </div>
  );
}

export { FRAME, FRAME_PANELS, FramedCard, HALO };
