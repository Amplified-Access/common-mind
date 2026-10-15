"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { CmsLogo } from "@/components/system/cms-logo";
import { FRAME, FRAME_PANELS } from "@/components/system/framed-card";
import type { Application } from "@/lib/content/types";
import { cn } from "@/lib/utils";

// How long each application holds before the thumbnail flips to the next.
const HOLD_MS = 2800;

// The applications CommonMind powers, one at a time: a framed thumbnail of
// the application's logo, lit by a fine grid as on the Applications page,
// that flips over to the next. It flips only while on screen; reduced
// motion crossfades instead.
function ApplicationFlipper({
  applications,
  className,
}: {
  applications: Application[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const app = applications[index];

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % applications.length), HOLD_MS);
    return () => clearTimeout(timer);
  }, [inView, index, applications.length]);

  if (!app) return null;

  return (
    <div ref={ref} className={cn("flex flex-col items-center gap-6", className)}>
      <div className={cn("flex aspect-16/10 w-full", FRAME)}>
        <div className={cn("relative flex-1 perspective-distant", FRAME_PANELS)}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={app.name}
              className="absolute inset-0 isolate flex items-center justify-center bg-[#0b0a07] backface-hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-grid [--grid-line:rgb(255_255_255/0.09)] mask-[radial-gradient(260px_115px_at_100%_50%,#000,rgb(0_0_0/0.45)_40%,rgb(0_0_0/0.12)_75%,transparent)]"
              />
              <CmsLogo image={app.logo} size={app.logoSize} alt={app.name} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <span aria-hidden className="flex gap-2">
        {applications.map((a, i) => (
          <span
            key={a.name}
            className={cn("size-1.5 rounded-full transition-colors duration-500", i === index ? "bg-signal" : "bg-white/20")}
          />
        ))}
      </span>
    </div>
  );
}

export { ApplicationFlipper };
