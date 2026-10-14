"use client";

import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// The root Lenis instance never remounts across client-side navigations —
// Next.js just swaps `children` — so its cached scroll limit (content
// height) goes stale whenever a route lands on a page with a different
// height. Left alone, scroll can stop short of the real bottom or refuse to
// reach content past where the previous page ended. Re-measuring after the
// new page has painted keeps Lenis in sync with what's actually on screen.
function LenisRouteReset() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    const id = requestAnimationFrame(() => lenis?.resize());
    return () => cancelAnimationFrame(id);
  }, [pathname, lenis]);

  return null;
}

export { LenisRouteReset };
