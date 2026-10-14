"use client";

import { ReactLenis } from "lenis/react";

import { LenisRouteReset } from "./lenis-route-reset";

function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, anchors: true }}>
      <LenisRouteReset />
      {children}
    </ReactLenis>
  );
}

export { SmoothScroll };
