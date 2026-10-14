"use client";

import { ReactLenis } from "lenis/react";

import { LenisHeightSync } from "./lenis-height-sync";

function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, anchors: true }}>
      <LenisHeightSync />
      {children}
    </ReactLenis>
  );
}

export { SmoothScroll };
