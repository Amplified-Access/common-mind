import { lugandaHeldOut, swahiliFlores } from "@/components/benchmarks/data";
import { Container } from "@/components/common/container";
import { BenchShowcase } from "@/components/home/bench-showcase";
import { Foundation } from "@/components/home/foundation";
import { HomeHero } from "@/components/home/hero";
import { LanguageEcosystems } from "@/components/home/language-ecosystems";
import { ModelCarousel } from "@/components/home/model-carousel";
import { PlatformTour } from "@/components/home/platform-tour";
import {
  ApplicationsVisual,
  CivicSpeechVisual,
  EvaluationVisual,
  LanguagesVisual,
  ModelsVisual,
} from "@/components/home/platform-visuals";
import { languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { researchItems } from "@/components/research/items";
import { cardColor, ColorCard } from "@/components/system/color-card";
import {
  ArrowLink,
  Eyebrow,
  Section,
  SectionHeader,
} from "@/components/system/primitives";
import { getContent } from "@/lib/content";
import { getPageCopy } from "@/lib/copy";
import { fill } from "@/lib/copy/fill";

export default async function Home() {
  const [content, copy] = await Promise.all([getContent(), getPageCopy("home")]);
  const { datasets } = content;
  const { platform } = copy;
  const ecosystems = languages.map((language) => {
    const { models, research } = ecosystemFor(language, content);
    return {
      code: language.code,
      name: language.name,
      models: models.length,
      datasets: datasets.filter((d) => d.languages.includes(language.name))
        .length,
      benchmark: models.length ? "CivicBench Africa" : undefined,
      researchHref: research[0] && `/research/${research[0].slug}`,
      description: fill(copy.languages.cardDescription, { name: language.name }),
      scores: [swahiliFlores, lugandaHeldOut].find(
        (set) => set.code === language.code,
      ),
    };
  });

  return (
    <>
      <HomeHero copy={copy.hero} />
      <Foundation copy={copy.foundation} />

      <section id="platform" className="zoom-viewport relative scroll-mt-16">
        <PlatformTour
          heading={platform.heading}
          intro={platform.intro}
          panels={[
            {
              id: "languages",
              title: platform.languages.title,
              subtitle: platform.languages.subtitle,
              body: platform.languages.body,
              href: "/languages",
              cta: platform.languages.cta,
              visual: <LanguagesVisual />,
            },
            {
              id: "civic-discourse",
              title: platform.civicDiscourse.title,
              subtitle: platform.civicDiscourse.subtitle,
              body: platform.civicDiscourse.body,
              href: "/research/civic-corpus",
              cta: platform.civicDiscourse.cta,
              visual: <CivicSpeechVisual />,
            },
            {
              id: "open-models",
              title: platform.openModels.title,
              subtitle: platform.openModels.subtitle,
              body: platform.openModels.body,
              proof: {
                value: platform.openModels.proofValue,
                label: platform.openModels.proofLabel,
              },
              href: "/models",
              cta: platform.openModels.cta,
              visual: <ModelsVisual />,
            },
            {
              id: "benchmarks",
              title: platform.benchmarks.title,
              subtitle: platform.benchmarks.subtitle,
              body: platform.benchmarks.body,
              proof: {
                value: platform.benchmarks.proofValue,
                label: platform.benchmarks.proofLabel,
              },
              href: "/benchmarks",
              cta: platform.benchmarks.cta,
              visual: <EvaluationVisual />,
            },
            {
              id: "applications",
              title: platform.applications.title,
              subtitle: platform.applications.subtitle,
              body: platform.applications.body,
              href: "/applications",
              cta: platform.applications.cta,
              visual: <ApplicationsVisual />,
            },
          ]}
        />
      </section>

      <ModelCarousel copy={copy.models} />

      <Section id="languages">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            eyebrow={copy.languages.eyebrow}
            title={copy.languages.title}
            lede={copy.languages.lede}
            ledeClassName="text-base"
          />
          <LanguageEcosystems ecosystems={ecosystems} />
        </Container>
      </Section>

      <Section id="civicbench">
        <Container className="flex flex-col gap-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.6fr)] lg:gap-12">
            <div className="flex flex-col gap-3">
              <Eyebrow>{copy.civicBench.eyebrow}</Eyebrow>
              <h2 className="text-h2 text-balance">{copy.civicBench.title}</h2>
            </div>
            <div className="flex max-w-md flex-col gap-6 lg:pt-8">
              <p className="text-base text-pretty text-foreground/85">
                {copy.civicBench.body}
              </p>
              <ArrowLink href="/benchmarks">{copy.civicBench.cta}</ArrowLink>
            </div>
            <p className="max-w-52 font-mono text-xs text-signal lg:pt-9">
              {copy.civicBench.aside}
            </p>
          </div>
          <BenchShowcase
            sets={[
              {
                id: "sw",
                from: "English",
                to: "Swahili",
                entries: swahiliFlores.entries,
                evalSet: swahiliFlores.evalSet,
              },
              {
                id: "lg",
                from: "English",
                to: "Luganda",
                entries: lugandaHeldOut.entries,
                evalSet: lugandaHeldOut.evalSet,
              },
            ]}
          />
        </Container>
      </Section>

      <Section id="research">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow={copy.research.eyebrow}
            title={copy.research.title}
            lede={copy.research.lede}
            ledeClassName="text-base"
            layout="split"
          />
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 lg:mask-[linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
            <ul className="grid w-max auto-cols-[16rem] grid-flow-col gap-5 md:w-full md:auto-cols-auto md:grid-flow-row md:grid-cols-4">
              {researchItems(content)
                .slice(0, 4)
                .map((item, i) => (
                  <li key={item.id} className="flex">
                    <ColorCard
                      href={item.href}
                      title={item.title}
                      kind={item.kind}
                      description={item.description}
                      cta={item.cta}
                      color={cardColor(i)}
                      className="w-full"
                    />
                  </li>
                ))}
            </ul>
          </div>
          <ArrowLink
            href="/research"
            arrow="right"
            className="self-end text-sm"
          >
            {copy.research.cta}
          </ArrowLink>
        </Container>
      </Section>
    </>
  );
}
