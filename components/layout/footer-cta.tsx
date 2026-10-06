"use client";

import { usePathname } from "next/navigation";

import { Grainient } from "@/components/system/grainient";
import { LinkButton } from "@/components/system/primitives";

// The model index already is the place "Explore Models" points to, so the
// closing call to action would only point back at the page itself.
function FooterCta() {
  const pathname = usePathname();
  if (pathname === "/models") return null;

  return (
    <section className="relative isolate overflow-hidden rounded-sm bg-signal text-background">
      <Grainient
        className="absolute! inset-0"
        colors={["#ffdc1f", "#d9b500", "#5c4c00"]}
        blendAngle={-30}
        warpAmplitude={60}
        contrast={1.08}
        grainAmount={0.16}
        grainScale={2.4}
      />
      <div className="relative flex min-h-100 flex-col items-center justify-center gap-5 px-6 py-20 text-center sm:px-14">
        <h2 className="max-w-xl text-[2.25rem] leading-[1.2] font-semibold tracking-[-0.02em] text-balance md:text-[2.75rem]">
          Build with the civic language layer.
        </h2>
        <p className="max-w-md text-base text-pretty">
          Use open models, data, benchmarks, and tools to build AI that understands
          how communities actually speak.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <LinkButton href="/build" variant="ink" arrow>
            Start Building
          </LinkButton>
          <LinkButton href="/models" variant="bright" arrow>
            Explore Models
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

export { FooterCta };
