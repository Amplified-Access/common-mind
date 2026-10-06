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
  grid?: boolean;
  stars?: boolean;
  /** A yellow glow rising from the bottom edge. */
  glow?: boolean;
  className?: string;
};

// The atmosphere behind heroes and feature panels. Sits behind its parent's
// content: give the parent `relative isolate`.
function Backdrop({ wash, grain, grid, stars, glow, className }: BackdropProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {wash && (
        <div className="absolute inset-x-0 top-0 h-[48rem] max-h-full bg-[radial-gradient(120%_90%_at_50%_0%,#2a2a28_0%,#121211_45%,#000_100%)]" />
      )}
      {glow && (
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(70%_100%_at_50%_100%,rgb(255_211_0/0.45)_0%,rgb(255_211_0/0.12)_45%,transparent_75%)]" />
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
    </div>
  );
}

export { Backdrop };
