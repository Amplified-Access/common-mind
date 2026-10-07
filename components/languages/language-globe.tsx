"use client";

import createGlobe from "cobe";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const SIGNAL: [number, number, number] = [1, 0.83, 0];

// A dotted globe turned toward Africa, with a yellow marker for each
// language. While on screen it sways gently around East Africa, so the
// markers never leave view; it holds still for reduced motion. Without
// WebGL the glow behind it still shows.
function LanguageGlobe({
  markers,
  className,
}: {
  markers: [number, number][];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The section may be zoomed with the viewport: render at the size the
    // canvas is actually shown, not its layout size.
    const measure = () => {
      const zoom = canvas.getBoundingClientRect().width / (canvas.offsetWidth || 1);
      return canvas.offsetWidth * Math.min(window.devicePixelRatio || 1, 2) * zoom;
    };

    const size = measure();
    // Faces roughly 30°E, East Africa.
    const facing = -2.15;
    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(canvas, {
        width: size,
        height: size,
        devicePixelRatio: 1,
        phi: facing,
        theta: 0.12,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 22000,
        mapBrightness: 5,
        mapBaseBrightness: 0.02,
        baseColor: [0.32, 0.32, 0.32],
        markerColor: SIGNAL,
        glowColor: [0.55, 0.45, 0.05],
        markers: markers.map((location) => ({ location, size: 0.035 })),
        scale: 1,
      });
    } catch {
      return;
    }

    let frame = 0;
    let visible = true;
    const start = performance.now();
    const tick = (now: number) => {
      if (visible && !reduce) {
        globe.update({ phi: facing + Math.sin((now - start) / 6000) * 0.35 });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      const next = measure();
      globe.update({ width: next, height: next });
    });
    ro.observe(canvas);

    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      globe.destroy();
    };
  }, [markers, reduce]);

  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        aria-hidden
        className="absolute inset-[11%] rounded-full shadow-[0_0_40px_4px_rgb(255_211_0/0.4)]"
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="relative size-full opacity-0 transition-opacity duration-1000"
      />
    </div>
  );
}

export { LanguageGlobe };
