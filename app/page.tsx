import { CivicExplorer } from "@/components/civic/civic-explorer";
import { Container } from "@/components/common/container";
import { Foundation } from "@/components/home/foundation";
import { HomeHero } from "@/components/home/hero";
import { PlatformTour } from "@/components/home/platform-tour";
import {
  ApplicationsVisual,
  CivicSpeechVisual,
  EvaluationVisual,
  LanguagesVisual,
  ModelsVisual,
} from "@/components/home/platform-visuals";
import { Section, SectionHeader } from "@/components/system/primitives";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <HomeHero />
      <Foundation />

      <section id="platform" className="zoom-viewport relative scroll-mt-16">
        <PlatformTour
          heading="The infrastructure layer for civic AI."
          intro="Languages, civic data, models, and evaluation are deeply connected. CommonMind brings them together in one open ecosystem so researchers and developers can build AI that understands civic speech beyond the mainstream."
          panels={[
            {
              id: "languages",
              title: "Languages",
              subtitle: "Start with the language.",
              body: "Every language carries its own civic vocabulary. Understanding begins with how communities actually describe public issues, services, government, and local priorities.",
              href: "/languages",
              cta: "Explore Languages",
              visual: <LanguagesVisual />,
            },
            {
              id: "civic-speech",
              title: "Civic Speech",
              subtitle: "Understand how communities speak.",
              body: "Real civic speech provides the language, terminology, and context AI needs to understand community voice beyond translation: voice becomes a transcript, a translation, and a civic record.",
              href: "/research/civic-corpus",
              cta: "Explore the Civic Corpus",
              visual: <CivicSpeechVisual />,
            },
            {
              id: "models",
              title: "Models",
              subtitle: "Small, open, adapted.",
              body: "Small, open models adapted for civic language, built to run on modest hardware and released with their weights and evaluation.",
              proof: { value: "≤1.37B", label: "parameters. Built to run on modest hardware." },
              href: "/models",
              cta: "Explore Models",
              visual: <ModelsVisual />,
            },
            {
              id: "evaluation",
              title: "Evaluation",
              subtitle: "Measure what improves.",
              body: "Reproducible measurement of civic understanding, on shared test sets with every third-party figure cited.",
              proof: { value: "38.74", label: "BLEU on English→Swahili, above Gemini 2.0 Flash." },
              href: "/benchmarks",
              cta: "View Benchmarks",
              visual: <EvaluationVisual />,
            },
            {
              id: "applications",
              title: "Civic Applications",
              subtitle: "From community voice to evidence.",
              body: "WatchTower, our reference application, turns community voice into structured evidence. Deployed in Kenya with a human rights partner to map reported incidents of technology-facilitated gender-based violence.",
              href: site.links.watchtower,
              cta: "thewatchtower.tech",
              visual: <ApplicationsVisual />,
            },
          ]}
        />
      </section>

      <Section id="civic-speech">
        <Container className="flex flex-col gap-20">
          <SectionHeader
            title="Understanding civic speech."
            lede="Civic speech is contextual. CommonMind turns what people say into structured records the right people can act on."
          />
          <CivicExplorer />
        </Container>
      </Section>
    </>
  );
}
