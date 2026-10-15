"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// A stippled sphere: points scattered evenly over a sphere's surface and
// projected flat, so they crowd toward the rim the way the shell of a real
// sphere does. A light from the upper left brightens one limb, and the far
// hemisphere is dimmed. Painted once, and again only when its size changes.

type DotOrbProps = {
  /** Points per square pixel of the orb's disc. */
  density?: number;
  className?: string;
};

// Small seeded PRNG (mulberry32), so the stipple is identical on every paint.
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const LIGHT = (() => {
  const v = [-0.55, -0.6, 0.58];
  const len = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / len);
})();

function DotOrb({ density = 0.045, className }: DotOrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const paint = () => {
      const size = Math.floor(canvas.getBoundingClientRect().width);
      if (size < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const r = size / 2;
      const count = Math.round(Math.PI * r * r * density);
      const rand = rng(7);
      const dot = Math.max(1.4, size / 420);

      for (let i = 0; i < count; i++) {
        // Uniform on the sphere: z uniform in [-1, 1], angle uniform.
        const z = rand() * 2 - 1;
        const a = rand() * Math.PI * 2;
        const ring = Math.sqrt(1 - z * z);
        const x = ring * Math.cos(a);
        const y = ring * Math.sin(a);

        const lit = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
        const front = z > 0 ? 1 : 0.35;
        // Grazing points near the limb read brighter than ones facing the
        // viewer, which hollows the centre out into a shell.
        const rim = 0.3 + 0.9 * (1 - Math.abs(z));
        const alpha = (0.1 + 0.42 * lit) * front * rim * (0.55 + rand() * 0.45);

        ctx.fillStyle = `rgba(237, 237, 234, ${alpha.toFixed(3)})`;
        ctx.fillRect(r + x * r * 0.985 - dot / 2, r + y * r * 0.985 - dot / 2, dot, dot);
      }
      setPainted(true);
    };

    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    paint();
    return () => ro.disconnect();
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn(
        "aspect-square w-full transition-opacity duration-[1600ms] ease-out",
        painted ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

export { DotOrb };
