import { lugandaHeldOut, swahiliFlores } from "@/components/benchmarks/data";
import { Container } from "@/components/common/container";
import { getModel } from "@/components/models/registry";
import { Backdrop } from "@/components/system/backdrop";
import { ArrowLink } from "@/components/system/primitives";

import { ModelShowcase, type ShowcaseSet } from "./model-showcase";

function showcaseModel(slug: string): ShowcaseSet["model"] {
  const model = getModel(slug);
  if (!model) throw new Error(`Unknown model slug: ${slug}`);
  return {
    slug: model.slug,
    name: model.name,
    tagline: model.tagline,
    platforms: model.platforms,
    overview: model.overview,
  };
}

function HomeHero() {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line">
      <Backdrop wash warmGrain sweep glow />
      <Container className="flex flex-col items-center gap-14 pt-20 sm:pt-24">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-display text-balance">
            Open civic infrastructure for 
            <span className="text-signal"> multilingual</span> AI.
          </h1>
          <p className="max-w-lg text-sm text-pretty text-foreground/90">
            CommonMind provides the open models, civic data, benchmarks,
            research, and developer tools needed to understand community voice
            across languages beyond the mainstream.
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 pt-4">
            <ArrowLink href="/models" tone="foreground">
              Explore Models
            </ArrowLink>
            <ArrowLink href="/models#try">Try a Model</ArrowLink>
          </div>
        </div>
        {/* Runs past the section's bottom edge, which cuts the cards off so
            they read as sitting behind the next section. */}
        <ModelShowcase
          className="-mb-5 sm:-mb-8"
          sets={[
            {
              id: "sw",
              from: "English",
              to: "Swahili",
              model: showcaseModel("swahili-gemma-1b-it"),
              entries: swahiliFlores.entries,
              evalSet: swahiliFlores.evalSet,
            },
            {
              id: "lg",
              from: "English",
              to: "Luganda",
              model: showcaseModel("luganda-gemma-1b-it"),
              entries: lugandaHeldOut.entries,
              evalSet: lugandaHeldOut.evalSet,
            },
          ]}
        />
      </Container>
    </section>
  );
}

export { HomeHero };
