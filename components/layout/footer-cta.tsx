"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { Grainient } from "@/components/system/grainient";
import { LinkButton } from "@/components/system/primitives";

// The models pages already put a model in front of the visitor, so the
// closing call to try one would just point back at the page itself.
function FooterCta() {
  const pathname = usePathname();
  if (pathname === "/models" || pathname.startsWith("/models/")) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-signal text-background">
      <Grainient
        className="absolute! inset-0"
        colors={["#fff46e", "#f6e800", "#bfb300"]}
        blendAngle={-25}
        contrast={1.05}
        grainAmount={0.09}
      />
      <div className="relative flex min-h-112 flex-col justify-center gap-10 p-8 sm:p-14 lg:p-20">
        <h2 className="text-h1 max-w-4xl font-semibold text-balance">
          Build on the civic language layer.
        </h2>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/build" variant="ink">
            Start building
          </LinkButton>
          <LinkButton href="/models#try" variant="ink-secondary">
            Try a model
          </LinkButton>
        </div>
        <Image
          src="/icon-black.svg"
          alt=""
          width={458}
          height={480}
          className="absolute right-8 bottom-8 h-10 w-auto sm:right-14 sm:bottom-14 lg:right-20 lg:bottom-20 lg:h-12"
        />
      </div>
    </section>
  );
}

export { FooterCta };
