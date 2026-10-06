"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/common/container";
import { ContourField } from "@/components/system/contour-field";
import { ArrowLink } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

export type TourPanel = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  proof?: { value: string; label: string };
  href: string;
  cta: string;
  visual: React.ReactNode;
};

const WIDE = "(min-width: 64rem)";

// The platform's layers as a row of panels. On wide screens the section
// pins while the reader scrolls and the row slides sideways; on narrow
// screens, and for reduced motion, it's a row to swipe through.
function PlatformTour({
  heading,
  intro,
  panels,
}: {
  heading: string;
  intro: string;
  panels: TourPanel[];
}) {
  const reduce = useReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    // Layout pixels, unaffected by the section's zoom.
    const measure = () => setDistance(Math.max(0, track.scrollWidth - viewport.clientWidth));
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    measure();
    return () => ro.disconnect();
  }, []);

  const pinned = wide && !reduce && distance > 0;
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  return (
    <div
      ref={outerRef}
      style={pinned ? { height: `calc(100dvh / var(--viewport-scale) + ${distance}px)` } : undefined}
    >
      <div
        className={cn(
          "flex flex-col justify-center gap-12 overflow-hidden py-20",
          pinned && "sticky top-0 h-[calc(100dvh/var(--viewport-scale))] py-10",
        )}
      >
        <Container className="flex flex-col gap-5">
          <h2 className="text-h2">{heading}</h2>
          <p className="max-w-md text-sm text-pretty text-foreground/85">{intro}</p>
        </Container>
        <Container
          ref={viewportRef}
          className={cn(!pinned && "scrollbar-none snap-x snap-mandatory scroll-px-4 overflow-x-auto md:scroll-px-8")}
        >
          <motion.div ref={trackRef} style={pinned ? { x } : undefined} className="flex w-max gap-0">
            {panels.map((panel, i) => (
              <article
                key={panel.id}
                id={`platform-${panel.id}`}
                className="relative isolate grid w-[min(86vw,68rem)] shrink-0 snap-start gap-8 overflow-hidden border-r border-line pr-8 lg:w-[68rem] lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-10 lg:pr-10"
              >
                <ContourField
                  className="absolute bottom-0 left-0 -z-10 h-[38%] w-[48%] opacity-80"
                  peak={0.4}
                  seed={i + 1}
                />
                <div className="flex flex-col gap-5 pt-8 pb-40 lg:pt-16">
                  <h3 className="text-h1">
                    {String(i + 1).padStart(2, "0")} {panel.title}
                  </h3>
                  <p className="font-mono text-base text-signal">{panel.subtitle}</p>
                  <p className="max-w-sm text-sm text-pretty text-foreground/85">{panel.body}</p>
                  {panel.proof && (
                    <p className="flex flex-col gap-1 pt-2">
                      <span className="font-mono text-2xl text-signal">{panel.proof.value}</span>
                      <span className="max-w-xs text-xs text-faint">{panel.proof.label}</span>
                    </p>
                  )}
                  <ArrowLink href={panel.href} className="pt-2">
                    {panel.cta}
                  </ArrowLink>
                </div>
                <div className="relative min-h-96 overflow-hidden rounded-t-lg border border-b-0 border-line bg-[#0b0a07] lg:min-h-[30rem]">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 -z-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_211_0/0.1),transparent)]"
                  />
                  <div className="relative size-full">{panel.visual}</div>
                </div>
              </article>
            ))}
          </motion.div>
        </Container>
      </div>
    </div>
  );
}

export { PlatformTour };
