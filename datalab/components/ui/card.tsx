import { cn } from "@/lib/utils";

// The main site's card in black and white: a hairline-edged frame around
// panels that sit flush inside it.
type FramedCardProps = React.ComponentProps<"div"> & {
  /** Classes for the inner box that holds the panels (a grid, say). */
  panelsClassName?: string;
};

function FramedCard({ className, panelsClassName, children, ...props }: FramedCardProps) {
  return (
    <div className={cn("flex rounded-card border border-frame-line bg-frame p-1.5 sm:p-2", className)} {...props}>
      <div className={cn("min-w-0 flex-1 overflow-hidden rounded-inset", panelsClassName)}>{children}</div>
    </div>
  );
}

/** A small mono label above a heading or a block. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tracking-wide text-subtle uppercase">{children}</span>;
}

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 md:px-8", className)}>{children}</div>;
}

export { Container, Eyebrow, FramedCard };
