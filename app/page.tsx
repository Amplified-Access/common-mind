import { Container } from "@/components/common/container";
import { CivicExplorer } from "@/components/civic/civic-explorer";
import { Foundation } from "@/components/home/foundation";
import { HomeHero } from "@/components/home/hero";
import { PipelineDiagram } from "@/components/system/pipeline-diagram";
import { Section, SectionHeader } from "@/components/system/primitives";
import { Reveal } from "@/components/system/reveal";
import { WatchTowerSection } from "@/components/watchtower/watchtower-section";

const proof = [
  { value: "38.74", label: "BLEU on English→Swahili, above Gemini 2.0 Flash", href: "/benchmarks#results" },
  { value: "≤1.37B", label: "parameters. Built to run on modest hardware", href: "/benchmarks#efficiency" },
  { value: "0.06→13.85", label: "BLEU on Luganda after civic adaptation", href: "/models/luganda-gemma-1b-it" },
];

export default function Home() {
  return (
    <>
      <HomeHero />
      <Foundation />

      <Section id="platform">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="The infrastructure layer for civic AI." />
          <Reveal>
            <PipelineDiagram outcomes={proof} />
          </Reveal>
        </Container>
      </Section>

      <Section id="civic-speech">
        <Container className="flex flex-col gap-20">
          <SectionHeader
            title="Understanding civic speech."
            lede="Civic speech is contextual. CommonMind turns what people say into structured records the right people can act on."
          />
          <CivicExplorer />
        </Container>
      </Section>

      <WatchTowerSection />
    </>
  );
}
