import { cn } from "@/lib/utils";

/** A bordered, rounded panel; panels inside set their own surface. */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("overflow-hidden rounded-3xl border border-line", className)}>{children}</div>;
}

/** A small mono label above a heading or a block. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tracking-wide text-subtle uppercase">{children}</span>;
}

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 md:px-8", className)}>{children}</div>;
}

export { Card, Container, Eyebrow };
