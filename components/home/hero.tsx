import { Container } from "@/components/common/container";
import { LinkButton } from "@/components/system/primitives";

import { EvidencePipeline } from "./evidence-pipeline";
import { HeroOrb } from "./hero-orb";

function HomeHero() {
  return (
    <section className="zoom-viewport relative overflow-hidden">
      <Container className="relative grid gap-20 pt-20 pb-20 sm:pt-28 sm:pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-24">
        <HeroOrb>
          <h1 className="text-[clamp(2.75rem,5.4vw,5.25rem)] leading-[1] font-medium tracking-[-0.04em] text-balance">
            Open civic infrastructure for{" "}
            <span className="text-signal">multilingual</span> AI.
          </h1>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/models">Explore models</LinkButton>
            <LinkButton href="/benchmarks" variant="secondary">
              View benchmarks
            </LinkButton>
          </div>
        </HeroOrb>
        <EvidencePipeline className="w-full max-w-xl lg:justify-self-end" />
      </Container>
    </section>
  );
}

export { HomeHero };
