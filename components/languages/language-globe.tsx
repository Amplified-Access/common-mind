"use client";

import { useMemo } from "react";

import { Globe, type GlobeMarker } from "@/components/system/globe";

import type { Language } from "./data";

// The languages sit within a few degrees of each other around Lake
// Victoria, so each name tag takes the side that keeps it clear of its
// neighbours.
const LABEL_SIDE: Record<string, GlobeMarker["side"]> = {
  om: "right",
  din: "left",
  lg: "left",
  luo: "right",
  rw: "bottom-left",
  sw: "right",
};

// A dotted globe turned toward East Africa, with a yellow marker and name
// tag for each language. It sways gently while on screen, so the markers
// never leave view, and can be dragged round.
function LanguageGlobe({
  languages,
  className,
}: {
  languages: Pick<Language, "code" | "name" | "location">[];
  className?: string;
}) {
  const markers = useMemo(
    () =>
      languages.map((language) => ({
        id: language.code,
        location: language.location,
        label: language.name,
        side: LABEL_SIDE[language.code],
      })),
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
