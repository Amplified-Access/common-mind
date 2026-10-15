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

export default async function Home() {
  const content = await getContent();
  const { datasets } = content;
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
      description: `Explore the models, civic speech resources, benchmarks, and research being developed to help AI understand ${language.name} in civic contexts.`,
      scores: [swahiliFlores, lugandaHeldOut].find(
        (set) => set.code === language.code,
      ),
    };
  });

  return (
    <>
      <HomeHero />
      <Foundation />

      <section id="platform" className="zoom-viewport relative scroll-mt-16">
        <PlatformTour
          heading="The infrastructure layer for civic AI."
          intro="Language data, open models, research, and benchmarks are deeply connected. CommonMind brings them together in one open ecosystem so researchers and developers can build AI that understands civic discourse in languages beyond the mainstream."
          panels={[
            {
              id: "languages",
              title: "Languages",
              subtitle: "Start with the language.",
              body: "Languages shape how communities describe public issues, access services, engage with institutions, and express local priorities. Undersranding these differences is the foundation of inclusive civic AI.",
              href: "/languages",
              cta: "Explore Languages",
              visual: <LanguagesVisual />,
            },
            {
              id: "civic-discourse",
              title: "Civic Discourse",
              subtitle: "Understand how communities communicate.",
              body: "Real civic discourse captures the language, expressions, and context communities use to discuss public issues, services, governance, and local priorities. Common mind transforms this into structured resources for deveoping and evaluating AI systems.",
              href: "/research/civic-corpus",
              cta: "Explore the Civic Corpus",
              visual: <CivicSpeechVisual />,
            },
            {
              id: "open-models",
              title: "Open models",
              subtitle: "Small, open, adapted.",
              body: "Small, open models adapted for multilingual civic applications. Designed for efficient deployment with accessible model weights and documented evaluations.",
              proof: {
                value: "≤1.37B",
                label: "parameters. Built to run on modest hardware.",
              },
              href: "/models",
              cta: "Explore Models",
              visual: <ModelsVisual />,
            },
            {
              id: "benchmarks",
              title: "Benchmarks",
              subtitle: "Measure what improves.",
              body: "Open benchmarks and reproducible evaluations measure model performance across languages and tasks, making progress transparent, comparable and verifiable.",
              proof: {
                value: "38.74",
                label: "BLEU on English→Swahili, above Gemini 2.0 Flash.",
              },
              href: "/benchmarks",
              cta: "View Benchmarks",
              visual: <EvaluationVisual />,
            },
            {
              id: "applications",
              title: "Civic Applications",
              subtitle: "From civic discourse to real world impact.",
              body: "CommonMind enables developers and organisations to build multilingual AI applications that turn civic discourse into meaningful insights, expand access to public information and services, strengthen community participation, and support more informed public decisions.",
              href: "/applications",
              cta: "Explore Applications",
              visual: <ApplicationsVisual />,
            },
          ]}
        />
      </section>

      <ModelCarousel />

      <Section id="languages">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            eyebrow="Language Ecosystems"
            title="Start with the language."
            lede="Every language carries its own expressions, context, and civic vocabulary. Explore the open models, datasets, benchmarks, and research that support civic AI development across languages."
          />
          <LanguageEcosystems ecosystems={ecosystems} />
        </Container>
      </Section>

      <Section id="civicbench">
        <Container className="flex flex-col gap-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.6fr)] lg:gap-12">
            <div className="flex flex-col gap-3">
              <Eyebrow>CivicBench Africa</Eyebrow>
              <h2 className="text-h2 text-balance">Measure what improves</h2>
            </div>
            <div className="flex max-w-md flex-col gap-6 lg:pt-8">
              <p className="text-sm text-pretty text-foreground/85">
                Reliable, reproducible evaluation for multilingual civic AI. CivicBench Africa measures model performance across languages, civic terminology, code-switching, translation, and issue classification, making progress transparent and comparable.
              </p>
              <ArrowLink href="/benchmarks">Explore Benchmarks</ArrowLink>
            </div>
            <p className="max-w-52 font-mono text-xs text-signal lg:pt-9">
              What gets measured can be improved.
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
            eyebrow="Research"
            title="Understanding civic discourse"
            lede="Explore the civic corpus, terminology mappings, and research that advance AI's ability to interpret civic discourse, language, and context across communities beyond the mainstream."
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
            Read More
          </ArrowLink>
        </Container>
      </Section>
    </>
  );
}
