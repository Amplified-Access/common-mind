import { cn } from "@/lib/utils";

const W = 600;
const H = 300;
const STEPS = 80;

// A ridge of nested contour lines, like a wireframe hill. Deterministic, so
// it renders identically on the server and the client.
function buildPaths(lines: number, peak: number, seed: number) {
  const paths: { d: string; opacity: number }[] = [];
  for (let i = 0; i < lines; i++) {
    const t = i / Math.max(1, lines - 1);
    const height = H * 0.92 * (1 - t * 0.85);
    const width = W * (0.16 + (1 - t) * 0.22);
    const center = W * peak + Math.sin(seed + i * 0.7) * 10;
    const points: string[] = [];
    for (let s = 0; s <= STEPS; s++) {
      const x = (s / STEPS) * W;
      const dx = (x - center) / width;
      const ridge =
        Math.exp(-dx * dx) +
        0.35 * Math.exp(-(((x - center - width * 1.3) / (width * 0.8)) ** 2)) +
        0.04 * Math.sin(x * 0.09 + seed * 3 + i);
      const y = H - Math.max(0, ridge) * height;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    paths.push({ d: `M${points.join("L")}`, opacity: 0.2 + (1 - t) * 0.7 });
  }
  return paths;
}

function ContourField({
  className,
  lines = 26,
  peak = 0.32,
  seed = 1,
}: {
  className?: string;
  lines?: number;
  /** Horizontal position of the summit, 0 to 1. */
  peak?: number;
  seed?: number;
}) {
  const paths = buildPaths(lines, peak, seed);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("pointer-events-none", className)}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="var(--signal)"
          strokeOpacity={p.opacity}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export { ContourField };
