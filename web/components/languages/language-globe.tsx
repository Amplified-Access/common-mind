"use client";

import { useMemo } from "react";

import { Globe } from "@/components/system/globe";

import type { Language } from "./data";

// A dotted globe turned toward East Africa, with a yellow marker for each
// language; the markers sit too close around Lake Victoria to carry name
// tags. It sways gently while on screen, so they never leave view, and can
// be dragged round.
function LanguageGlobe({
  languages,
  className,
}: {
  languages: Pick<Language, "code" | "location">[];
  className?: string;
}) {
  const markers = useMemo(
    () =>
      languages.map((language) => ({ id: language.code, location: language.location })),
    [languages],
  );

  return (
    <Globe
      markers={markers}
      // Faces roughly 30°E.
      phi={-2.15}
      theta={0.12}
      sway={0.35}
      markerSize={0.035}
      className={className}
      halo={
        <div
          aria-hidden
          className="absolute inset-[11%] rounded-full shadow-[0_0_40px_4px_rgb(255_211_0/0.4)]"
        />
      }
    />
  );
}

export { LanguageGlobe };
