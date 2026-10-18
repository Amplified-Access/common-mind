import { lugandaHeldOut, swahiliFlores, type LanguageBenchmark } from "@/components/benchmarks/data";
import { Container } from "@/components/common/container";
import { registryModels } from "@/components/models/registry";
import { Backdrop } from "@/components/system/backdrop";
import { LinkButton } from "@/components/system/primitives";
import { Emphasized } from "@/lib/copy/emphasized";
import type { PageCopy } from "@/lib/copy/pages";

import type { Outcome } from "./funnel";
import { HeroDeck } from "./hero-deck";

const byBleu = (set: LanguageBenchmark) => [...set.entries].sort((a, b) => b.bleu - a.bleu);

// What comes out of the whole platform, flipped through on the funnel's
// CommonMind card; every figure is read from the benchmark data.
function outcomes(): Outcome[] {
  const swahili = byBleu(swahiliFlores);
  const ours = swahili.find((e) => e.isOurs)!;
  const rival = swahili.find((e) => !e.isOurs)!;
  const luganda = byBleu(lugandaHeldOut);
  const largest = registryModels.reduce((a, b) => (b.base.paramsNumeric > a.base.paramsNumeric ? b : a));
  return [
    {
      value: ours.bleu.toFixed(2),
      label: `BLEU on English→Swahili, above ${rival.model}`,
      href: "/benchmarks#results",
    },
    {
      value: `≤${largest.base.params}`,
      label: "parameters. Built to run on modest hardware",
      href: "/benchmarks#efficiency",
    },
    {
      value: `${luganda.at(-1)!.bleu}→${luganda[0].bleu}`,
      label: "BLEU on Luganda after civic adaptation",
      href: "/models/luganda-gemma-1b-it",
    },
  ];
}

function HomeHero({ copy }: { copy: PageCopy<"home">["hero"] }) {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line pt-(--header-height)">
      <Backdrop wash warmGrain sweep glow />
      <Container className="flex flex-col items-center gap-14 pt-20 sm:pt-24">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-display text-balance">
            <Emphasized text={copy.titleLine1} />{" "}
            <span className="block">
              <Emphasized text={copy.titleLine2} />
            </span>
          </h1>
          <p className="max-w-xl text-base text-pretty text-foreground/90">
            {copy.lede}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <LinkButton href="/models">{copy.primaryCta}</LinkButton>
            <LinkButton href="/models#try" variant="outline">
              {copy.secondaryCta}
            </LinkButton>
          </div>
        </div>
        {/* Runs past the section's bottom edge, which cuts the cards off so
            they read as sitting behind the next section. */}
        <HeroDeck outcomes={outcomes()} className="-mb-5 sm:-mb-8" />
      </Container>
    </section>
  );
}

export { HomeHero };
