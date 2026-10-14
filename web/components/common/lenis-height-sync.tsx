"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

// Lenis caches the page's scroll limit and re-measures when its content
// element resizes. With the root instance that element is <html>, which the
// layout pins to the viewport height (`h-full`), so it never resizes: a new
// route, or content that renders after its data loads (the Data Lab), leaves
// the limit stale and scrolling stops short of the bottom. <body> grows with
// the content, so re-measuring whenever it resizes keeps Lenis in step.
function LenisHeightSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [lenis]);

  return null;
}

export { LenisHeightSync };
