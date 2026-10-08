"use client";

import createGlobe from "cobe";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const LABEL_SIDE = {
  top: "bottom-[anchor(top)] left-[anchor(center)] mb-2 -translate-x-1/2",
  bottom: "top-[anchor(bottom)] left-[anchor(center)] mt-2 -translate-x-1/2",
  left: "right-[anchor(left)] top-[anchor(center)] mr-2.5 -translate-y-1/2",
  right: "left-[anchor(right)] top-[anchor(center)] ml-2.5 -translate-y-1/2",
  "bottom-left": "top-[anchor(bottom)] right-[anchor(center)] mt-2",
};

type GlobeMarker = {
  /** Also names the marker's CSS anchor, so it must be a valid identifier. */
  id: string;
  /** [latitude, longitude] */
  location: [number, number];
  label?: string;
  /** Which side of the marker its label sits on. */
  side?: keyof typeof LABEL_SIDE;
};

type GlobeProps = {
  markers?: GlobeMarker[];
  /** Longitude turned to face the viewer, in cobe's radians. */
  phi?: number;
  /** Tilt toward the viewer, in radians. */
  theta?: number;
  /** How far, in radians, the globe sways either side of `phi` while idle. */
  sway?: number;
  markerSize?: number;
  /** Drawn behind the canvas: a glow or ring that shows even without WebGL. */
  halo?: React.ReactNode;
  className?: string;
};

// Drag pixels per radian of spin.
const DRAG_PX = 300;
// Fastest a flick can set it coasting, in radians per ms; it then coasts
// under a radian before stopping.
const MAX_SPIN = 0.0025;
// After a drag settles, how long the globe holds before easing home.
const RETURN_DELAY = 1500;
// Share of the coasting speed, and of the way home, kept per 60fps frame.
const COAST = 0.95;
const RETURN = 0.97;

// A dotted cobe globe. While idle it sways around `phi`; drag it sideways to
// spin it, and it coasts, then eases back to face `phi` again. Labelled
// markers carry name tags that cobe anchors to them, fading out on the far
// side. Reduced motion keeps it still unless dragged.
function Globe({
  markers = [],
  phi = 0,
  theta = 0.2,
  sway = 0,
  markerSize = 0.03,
  halo,
  className,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  // Spin added by dragging, in radians, and its coasting speed per ms.
  const drag = useRef({ active: false, x: 0, t: 0, offset: 0, velocity: 0, releasedAt: 0 });

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
    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(canvas, {
        width: size,
        height: size,
        devicePixelRatio: 1,
        phi,
        theta,
        dark: 1,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [1, 0.83, 0],
        glowColor: [0.3, 0.3, 0.3],
        markerElevation: 0.02,
        markers: markers.map(({ id, location }) => ({ id, location, size: markerSize })),
      });
    } catch {
      return;
    }

    let frame = 0;
    let visible = true;
    const start = performance.now();
    let last = start;
    const state = drag.current;
    const tick = (now: number) => {
      // Timed by the clock, so it moves alike at any frame rate.
      const dt = Math.min(now - last, 64);
      const frames = dt / (1000 / 60);
      last = now;
      if (!state.active && !reduce) {
        // Coast on the release speed, then ease home the short way round.
        state.offset += state.velocity * dt;
        state.velocity *= COAST ** frames;
        if (Math.abs(state.velocity) < 0.00003 && now - state.releasedAt > RETURN_DELAY) {
          const wrapped = Math.atan2(Math.sin(state.offset), Math.cos(state.offset));
          state.offset = wrapped * RETURN ** frames;
        }
      }
      if (visible || state.active) {
        const swaying = reduce ? 0 : Math.sin((now - start) / 6000) * sway;
        globe.update({ phi: phi + swaying + state.offset });
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
  }, [markers, markerSize, phi, theta, sway, reduce]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    Object.assign(drag.current, { active: true, x: e.clientX, t: e.timeStamp, velocity: 0 });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = drag.current;
    if (!state.active) return;
    const step = (e.clientX - state.x) / DRAG_PX;
    // Capped so a flick can't whip the languages round the back.
    const speed = step / Math.max(e.timeStamp - state.t, 1);
    state.velocity = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, speed));
    state.offset += step;
    state.x = e.clientX;
    state.t = e.timeStamp;
  };
  const onPointerUp = () => {
    const state = drag.current;
    state.active = false;
    state.releasedAt = performance.now();
    if (reduce) state.velocity = 0;
  };

  return (
    <div className={cn("relative aspect-square select-none", className)}>
      {halo}
      {/* Its own box: cobe wraps the canvas in a div of its own, which also
          holds the anchors the labels are positioned against. */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // Vertical swipes still scroll the page on touch screens.
          className="size-full cursor-grab touch-pan-y rounded-full opacity-0 transition-opacity duration-1000 active:cursor-grabbing"
        />
      </div>
      {markers.map(
        (marker) =>
          marker.label && (
            <span
              key={marker.id}
              aria-hidden
              style={
                {
                  positionAnchor: `--cobe-${marker.id}`,
                  // cobe sets the variable (to a non-number) only while the
                  // marker faces the viewer; any set value voids these two
                  // declarations, leaving the label opaque and sharp.
                  opacity: `var(--cobe-visible-${marker.id}, 0)`,
                  filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 6px))`,
                } as React.CSSProperties
              }
              className={cn(
                "pointer-events-none absolute hidden border border-line-strong bg-background/80 px-1.5 py-0.5 font-mono text-[10px] tracking-wider whitespace-nowrap text-foreground/90 uppercase backdrop-blur-sm transition-[opacity,filter] duration-700 supports-[anchor-name:--a]:block",
                LABEL_SIDE[marker.side ?? "top"],
              )}
            >
              {marker.label}
            </span>
          ),
      )}
    </div>
  );
}

export { Globe, type GlobeMarker };
