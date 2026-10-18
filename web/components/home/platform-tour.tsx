"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/common/container";
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

// Pinning needs a wide viewport with room for the heading and a panel:
// at least 64rem across and 600 layout pixels tall once the section's zoom
// is accounted for. Shorter screens get the swipeable row instead.
const MIN_PIN_WIDTH = 1024;
const MIN_PIN_HEIGHT = 600;

function fitsPinned() {
  const scale = Math.min(1.5, Math.max(1, window.innerWidth / 1280));
  return window.innerWidth >= MIN_PIN_WIDTH && window.innerHeight / scale >= MIN_PIN_HEIGHT;
}

// The platform's layers as a row of panels, each ending on a hairline that
// runs up to the section's top edge. On large screens the section pins
// while the reader scrolls and the row slides sideways; on small screens,
// and for reduced motion, it's a row to swipe through.
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
    const sync = () => setWide(fitsPinned());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    // Layout pixels, unaffected by the section's zoom. The slide ends with
    // the last panel's edge on the container's content edge, inside its
    // padding.
    const measure = () => {
      const style = getComputedStyle(viewport);
      const content = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setDistance(Math.max(0, track.scrollWidth - content));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    measure();
    return () => ro.disconnect();
  }, []);

  const pinned = wide && !reduce && distance > 0;

  // The page scroll range over which the section is pinned, read from its
  // on-screen box. useScroll's own target tracking measures the section
  // without its zoom and starts the slide early.
  const [range, setRange] = useState<[number, number]>([0, 1]);
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const measure = () => {
      const box = outer.getBoundingClientRect();
      const start = box.top + window.scrollY;
      setRange([start, Math.max(start + 1, start + box.height - window.innerHeight)]);
    };
    // The document's size changes whenever anything above the section does.
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(document.documentElement);
    measure();
    return () => ro.disconnect();
  }, [pinned]);

  const { scrollY } = useScroll();
  const x = useTransform(scrollY, range, [0, -distance], { clamp: true });

  return (
    <div
      ref={outerRef}
      style={pinned ? { height: `calc(100dvh / var(--viewport-scale) + ${distance}px)` } : undefined}
    >
      {/* Top-aligned under room for the floating header, so the heading is
          never cut; the panels take the rest of the height. */}
      <div
        className={cn(
          "flex flex-col gap-8 overflow-hidden pt-20",
          pinned && "sticky top-0 h-[calc(100dvh/var(--viewport-scale))] pt-16",
        )}
      >
        <Container className="relative z-10 flex flex-col gap-5">
          <h2 className="text-h2">{heading}</h2>
          <p className="max-w-md text-base text-pretty text-foreground/85">{intro}</p>
        </Container>
        <Container
          ref={viewportRef}
          className={cn(
            pinned ? "min-h-0 flex-1" : "scrollbar-none snap-x snap-mandatory scroll-px-4 overflow-x-auto md:scroll-px-8 xl:scroll-px-12",
          )}
        >
          <motion.div ref={trackRef} style={pinned ? { x } : undefined} className="flex h-full w-max">
            {panels.map((panel, i) => (
              <article
                key={panel.id}
                id={`platform-${panel.id}`}
                className="relative isolate box-content grid w-[min(80vw,60rem)] shrink-0 snap-start border-r border-line pl-6 first:pl-0 lg:w-[60rem] lg:grid-cols-[minmax(0,0.54fr)_minmax(0,1fr)] lg:pl-18"
              >
                {/* The panel's edge carried up past the heading to the top. */}
                <span aria-hidden className="absolute -right-px bottom-full h-screen w-px bg-line" />
                <div className="relative flex flex-col gap-5 pt-8 pb-40 lg:pt-14 lg:pr-10">
                  {/* The wireframe ribbon, at the mock's scale: it starts a
                      panel gap left of the text, its tip about 42px above the
                      bottom edge, and fades out behind the card. */}
                  <div
                    aria-hidden
                    className="absolute bottom-0 -left-6 -z-10 aspect-[1005/565] w-[32rem] translate-y-[40%] bg-[url(/tour-ribbon.svg)] bg-contain bg-no-repeat lg:-left-18 lg:w-[53.25rem]"
                  />
                  <h3 className="text-h1">
                    {String(i + 1).padStart(2, "0")} {panel.title}
                  </h3>
                  <p className="font-mono text-base text-signal">{panel.subtitle}</p>
                  <p className="max-w-md text-base text-pretty text-foreground/85">{panel.body}</p>
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
                {/* Framed like the hero cards on the top and left; flush with
                    the panel's edge on the right and the section's bottom. */}
                <div className="relative min-h-96 rounded-tl-card border-t border-l border-line bg-[#131000] pt-2 pl-2 shadow-[0_-20px_70px_-10px_rgb(255_211_0/0.1)] lg:min-h-0">
                  <div className="relative size-full overflow-hidden rounded-tl-inset bg-[#0b0a07]">
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_211_0/0.1),transparent)]"
                    />
                    <div className="relative size-full">{panel.visual}</div>
                  </div>
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
