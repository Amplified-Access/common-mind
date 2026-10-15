import { cn } from "@/lib/utils";

// Deterministic star positions (stable across server and client).
const STARS = Array.from({ length: 70 }, (_, i) => {
  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1;
  return {
    x: rand(1) * 100,
    y: rand(2) * 100,
    size: rand(3) > 0.85 ? 2 : 1,
    opacity: 0.15 + rand(4) * 0.45,
  };
});

type BackdropProps = {
  /** The grainy grey wash used behind page heroes. */
  wash?: boolean;
  grain?: boolean;
  /** Warm, faintly yellow grain that runs the full height. */
  warmGrain?: boolean;
  grid?: boolean;
  /** Grids at either edge, brightest at the edge and fading toward the
      middle and the bottom. Drawn over the shade. */
  sideGrids?: boolean;
  stars?: boolean;
  /** Darkness sweeping in from the top-right corner, fading out toward the
      bottom left so the wash and grain show through there. */
  sweep?: boolean;
  /** A yellow glow rising from the bottom edge, reaching both corners. */
  glow?: boolean;
  /** Darkness over the wash for page heroes: deepening toward the right, and
      black rising from below so only the top-left glows faintly. */
  shade?: boolean;
  className?: string;
};

// The atmosphere behind heroes and feature panels. Sits behind its parent's
// content: give the parent `relative isolate`.
function Backdrop({
  wash,
  grain,
  warmGrain,
  grid,
  sideGrids,
  stars,
  sweep,
  glow,
  shade,
  className,
}: BackdropProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {wash && (
        <div className="absolute inset-x-0 top-0 h-[48rem] max-h-full bg-[radial-gradient(120%_90%_at_50%_0%,#2a2a28_0%,#121211_45%,#000_100%)]" />
      )}
      {grid && (
        <div className="absolute inset-x-0 top-0 h-[48rem] max-h-full bg-grid mask-[radial-gradient(80%_70%_at_50%_40%,#000_20%,transparent_100%)]" />
      )}
      {stars &&
        STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      {grain && (
        <div className="absolute inset-x-0 top-0 h-[48rem] max-h-full bg-grain opacity-25 mix-blend-screen mask-[linear-gradient(to_bottom,#000_60%,transparent)]" />
      )}
      {warmGrain && <div className="absolute inset-0 bg-grain-warm opacity-25 mix-blend-screen" />}
      {sweep && (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_left,#000_0%,rgb(0_0_0/0.92)_30%,rgb(0_0_0/0.5)_55%,transparent_80%)]" />
      )}
      {shade && (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_4rem,#000_26rem),linear-gradient(to_right,rgb(0_0_0/0.5),rgb(0_0_0/0.85)_60%,rgb(0_0_0/0.95))]" />
      )}
      {sideGrids && (
        <>
          {/* Lit from the middle of each edge and gone a few cells in, the
              way the model cards light theirs; the reach is in screen pixels,
              so it covers the same few cells at any zoom. The right grid
              runs half a row lower, as in the Research and Policy mocks. */}
          <div className="absolute top-0 left-0 h-[30rem] w-[min(28rem,40%)] bg-grid bg-grid-wide [--grid-line:rgb(255_255_255/0.22)] mask-[radial-gradient(calc(300*var(--screen-px))_calc(170*var(--screen-px))_at_0%_50%,#000,rgb(0_0_0/0.45)_40%,rgb(0_0_0/0.12)_75%,transparent)] bg-position-[0_calc(30*var(--screen-px))]" />
          <div className="absolute top-0 right-0 h-[30rem] w-[min(28rem,40%)] bg-grid bg-grid-wide [--grid-line:rgb(255_255_255/0.22)] mask-[radial-gradient(calc(300*var(--screen-px))_calc(170*var(--screen-px))_at_100%_50%,#000,rgb(0_0_0/0.45)_40%,rgb(0_0_0/0.12)_75%,transparent)] bg-position-[right_1px_top_0]" />
        </>
      )}
      {glow && (
        <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_100%,rgb(255_211_0/0.2)_0%,rgb(255_211_0/0.14)_45%,rgb(255_211_0/0.05)_75%,transparent_100%)]" />
      )}
    </div>
  );
}

export { Backdrop };
