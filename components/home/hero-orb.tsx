"use client";

import { useEffect, useRef, useState } from "react";

import { DotOrb } from "@/components/system/dot-orb";
import { cn } from "@/lib/utils";

// Sits a DotOrb behind its children, centred horizontally on the heading's
// rendered lines rather than on the box around them. Balanced, left-aligned
// lines stop short of the column's right edge, so the column's centre sits
// to the right of the words. From there it shifts left by a fifth of its
// own width, so the words sit off-centre toward its right side. Vertically
// it stays centred on the block.
function HeroOrb({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [x, setX] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    const heading = el?.querySelector("h1");
    if (!el || !heading) return;

    const measure = () => {
      // A range over the heading's contents spans only its text, not the
      // full-width block box.
      const range = document.createRange();
      range.selectNodeContents(heading);
      const text = range.getBoundingClientRect();
      setX(text.left + text.width / 2 - el.getBoundingClientRect().left);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    // Line widths change once the web font replaces the fallback.
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cn("relative isolate", className)}>
      <div
        className="pointer-events-none absolute top-1/2 -z-10 w-[min(44rem,135%)] opacity-60 -translate-x-[70%] -translate-y-1/2"
        style={{ left: x ?? "50%" }}
      >
        <DotOrb />
      </div>
      <div ref={ref} className="flex flex-col gap-10">
        {children}
      </div>
    </div>
  );
}

export { HeroOrb };
