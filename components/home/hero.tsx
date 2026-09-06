"use client";

import { useLenis } from "lenis/react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { Container } from "../common/container";

type InfoBlock = {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

const INFO_BLOCKS: InfoBlock[] = [
  {
    eyebrow: "Models",
    heading: "Open models, built for local languages.",
    description:
      "From Luganda to Swahili, CommonMind trains and evaluates models grounded in the languages and knowledge of the communities they serve, not translated afterthoughts.",
    ctaLabel: "Explore models",
    ctaHref: "/models",
  },
  {
    eyebrow: "Open data",
    heading: "Every dataset, fully open.",
    description:
      "Translation pairs, instructions, speech, and evaluation sets: the data behind CommonMind is public, so progress on underserved languages compounds instead of resetting.",
    ctaLabel: "Browse datasets",
    ctaHref: "/datasets",
  },
];

// The box settles at this scale, so the gap it reveals on either side is
// exactly (1 - BOX_SCALE) of the container's width.
const BOX_SCALE = 0.55;
const GAP_WIDTH = `${(1 - BOX_SCALE) * 100}%`;

// rounded-2xl resolves to 18px (--radius: 0.625rem * 1.8). transform: scale()
// shrinks the rendered corner curve by the same factor as the box, so at
// BOX_SCALE the corners read as visibly sharper even though the radius/size
// ratio is unchanged. Dividing the local radius by the live scale cancels
// that out, keeping the on-screen radius a constant 18px throughout.
const BASE_RADIUS = 18;

type SideContentProps = InfoBlock & {
  align: "left" | "right";
  opacity: MotionValue<number>;
  y: MotionValue<number>;
};

function SideContent({
  align,
  opacity,
  y,
  eyebrow,
  heading,
  description,
  ctaLabel,
  ctaHref,
}: SideContentProps) {
  const isLeft = align === "left";

  return (
    <motion.div
      style={{ opacity, y, width: GAP_WIDTH }}
      className={`absolute inset-y-0 flex flex-col items-center justify-center px-6 sm:px-8 ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      <div className="flex max-w-md flex-col items-start gap-4 text-left">
        <span className="text-xs font-medium tracking-widest text-white/60 uppercase">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
          {heading}
        </h2>
        <p className="text-base text-white/70">{description}</p>
        <Button
          nativeButton={false}
          render={<Link href={ctaHref} />}
          className="bg-white text-black hover:bg-white/85"
        >
          {ctaLabel} →
        </Button>
      </div>
    </motion.div>
  );
}

// Mobile skips the scroll-jacked overlay entirely, so this renders each info
// block as a normal static section instead of an absolutely-positioned,
// scroll-linked reveal.
function MobileInfoBlock({ eyebrow, heading, description, ctaLabel, ctaHref }: InfoBlock) {
  return (
    <div className="flex flex-col items-start gap-4 text-left">
      <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-semibold tracking-tight text-balance text-black">
        {heading}
      </h2>
      <p className="text-base text-gray-600">{description}</p>
      <Button nativeButton={false} render={<Link href={ctaHref} />}>
        {ctaLabel} →
      </Button>
    </div>
  );
}

// Phase 1 (0 – 0.2): shrink + slide right, revealing content on the left.
// Hold A (0.2 – 0.3): pause so the left content can be read.
// Phase 2 (0.3 – 0.5): slide left at a fixed scale, revealing content on the right.
// Hold B (0.5 – 0.6): pause so the right content can be read.
// Phase 3 (0.6 – 0.85): grow back to full size, filling the screen again.
// Final hold (0.85 – 1).
const P1_END = 0.2;
const HOLD_A_END = 0.3;
const P2_END = 0.5;
const HOLD_B_END = 0.6;
const P3_END = 0.85;

// One wheel/touch gesture should carry the reader from one readable stop to
// the next — the resting frame, the middle of each hold, then the final
// frame — rather than dribbling through the animation over many scroll
// ticks, or (the other extreme) blowing past every stop in a single scroll.
const SNAP_PROGRESS = [0, (P1_END + HOLD_A_END) / 2, (P2_END + HOLD_B_END) / 2, 1];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Below this width the scroll-jacked, side-sliding hero is skipped entirely
// in favor of a normal stacked layout. Starts `true` so the first client
// render matches the server-rendered (desktop) markup; the media query
// corrects it right after mount.
const DESKTOP_QUERY = "(min-width: 640px)";

const Hero = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const snapPixelsRef = useRef<number[] | null>(null);
  const snappingRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Layout effect (not a plain effect) so the mobile/desktop branch below is
  // corrected before the browser paints, rather than one frame after — that
  // one-frame gap is what showed up as a visible aspect-ratio pop on mobile.
  useLayoutEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = targetRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const bottom = top + el.offsetHeight - window.innerHeight;
      const pixels = SNAP_PROGRESS.map((p) => top + p * (bottom - top));
      // scrollYProgress hits 1 (pixels' last entry above) once the box has
      // zoomed back to full frame, but the section's own box — and the next
      // section's start — sits a further viewport down. That hand-off to the
      // next section is its own stop, separate from the zoom-back landing,
      // so one gesture never does both at once.
      pixels.push(top + el.offsetHeight);
      snapPixelsRef.current = pixels;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useLenis((lenis) => {
    if (!isDesktop) return;
    const snapPixels = snapPixelsRef.current;
    if (!snapPixels || lenis.direction === 0) return;

    const { scroll, direction } = lenis;
    const first = snapPixels[0];
    const last = snapPixels[snapPixels.length - 1];
    const withinHero = scroll > first - 1 && scroll < last + 1;
    if (!withinHero) {
      snappingRef.current = false;
      return;
    }
    if (snappingRef.current) return;

    const EPS = 2;
    let target: number | undefined;
    if (direction === 1) {
      target = snapPixels.find((p) => p > scroll + EPS);
    } else {
      target = [...snapPixels].reverse().find((p) => p < scroll - EPS);
    }
    if (target === undefined) return;

    snappingRef.current = true;
    // Lenis's own `resize()` (fired e.g. by the header's ResizeObserver
    // toggling its padding mid-snap) doesn't touch a running locked
    // animation or call its `onComplete` — it just lets the tween keep
    // ticking toward a now-stale target. If that happens, onComplete never
    // fires and this ref would stay stuck `true` forever, permanently
    // disabling snapping. The timeout guarantees it clears regardless.
    const unlock = () => {
      snappingRef.current = false;
    };
    const fallback = window.setTimeout(unlock, 1100 + 200);
    lenis.scrollTo(target, {
      duration: 1.1,
      easing: easeInOutCubic,
      lock: true,
      onComplete: () => {
        window.clearTimeout(fallback);
        unlock();
      },
    });
  });

  const SHIFT = `-${(1 - BOX_SCALE) * 100}%`;

  const scale = useTransform(
    scrollYProgress,
    [0, P1_END, HOLD_B_END, P3_END, 1],
    [1, BOX_SCALE, BOX_SCALE, 1, 1],
  );
  const x = useTransform(
    scrollYProgress,
    [0, HOLD_A_END, P2_END, HOLD_B_END, P3_END, 1],
    ["0%", "0%", SHIFT, SHIFT, "0%", "0%"],
  );
  const borderRadius = useTransform(scale, (s) => `${BASE_RADIUS / s}px`);

  const leftOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, HOLD_A_END, HOLD_A_END + 0.05],
    [0, 1, 1, 0],
  );
  const leftY = useTransform(scrollYProgress, [0, 0.1], [24, 0]);

  const rightOpacity = useTransform(
    scrollYProgress,
    [P2_END - 0.05, P2_END, HOLD_B_END, HOLD_B_END + 0.05],
    [0, 1, 1, 0],
  );
  const rightY = useTransform(scrollYProgress, [P2_END - 0.05, P2_END], [24, 0]);

  // The heading only belongs on the video's initial full-frame state — fade
  // it out as soon as scrolling starts, and back in once the box returns to
  // full size at the end.
  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, P3_END, P3_END + 0.05],
    [1, 0, 0, 1],
  );

  // The page background matches the resting, full-frame state and drops to
  // black for the scroll-driven interaction in between, since the side
  // content is styled for a dark backdrop during that stretch.
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.05, P3_END, P3_END + 0.05],
    ["#f4f4f4", "#000000", "#000000", "#f4f4f4"],
  );

  if (!isDesktop) {
    return (
      <section className="bg-[#f4f4f4]">
        <Container size="full">
          <div className="flex flex-col gap-16 pt-4 pb-12">
            <div className="relative flex aspect-6/9 w-full items-center justify-center overflow-hidden rounded-2xl bg-black px-6 text-center">
              <video
                src="/video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50" />
              <h1 className="relative text-4xl text-balance text-white">
                Building the open foundations for Inclusive AI.
              </h1>
            </div>
            {INFO_BLOCKS.map((block) => (
              <MobileInfoBlock key={block.eyebrow} {...block} />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <motion.section
      ref={targetRef}
      style={{ backgroundColor }}
      className="relative h-[650vh]"
    >
      <div className="sticky top-0 flex h-[100vw] items-center overflow-hidden pt-4 lg:h-[calc((100vw-32px)*0.5625+32px)]">
        <Container size={"full"}>
          <div className="relative">
            <SideContent
              align="left"
              opacity={leftOpacity}
              y={leftY}
              {...INFO_BLOCKS[0]}
            />
            <SideContent
              align="right"
              opacity={rightOpacity}
              y={rightY}
              {...INFO_BLOCKS[1]}
            />
            <motion.div
              style={{ scale, x, borderRadius }}
              className="relative flex aspect-square w-full origin-right items-center justify-center overflow-hidden bg-black px-8 text-center lg:aspect-video"
            >
              <video
                src="/video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50" />
              <motion.div style={{ opacity: headingOpacity }} className="relative">
                <h1 className="text-4xl text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
                  Building the open foundations for Inclusive AI.
                </h1>
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </div>
    </motion.section>
  );
};

export default Hero;
