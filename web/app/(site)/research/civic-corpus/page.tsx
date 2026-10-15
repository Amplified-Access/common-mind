import type { Metadata } from "next";

import { CivicExplorer } from "@/components/civic/civic-explorer";
import { TerminologyViewer } from "@/components/civic/terminology-viewer";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, Panel, Section, SectionHeader } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Civic corpus",
  description:
    "Language data, local terminology, and contextual knowledge that help AI interpret civic discourse in context.",
};

// Training mixtures as reported in each technical report. Totals are the sum
// of the listed sources.
const mixtures = [
  {
    name: "Swahili-gemma-1B-it",
    unit: "listed examples",
    parts: [
      { label: "Rogendo", value: 58052 },
      { label: "MAFAND-MT", value: 32414 },
      { label: "Inkuba", value: 29991 },
      { label: "SALT", value: 23947 },
      { label: "Alpaca", value: 14844 },
      { label: "Aya", value: 359 },
    ],
  },
  {
    name: "Swahili-nllb",
    unit: "listed sentence pairs",
    parts: [
      { label: "Rogendo", value: 60000 },
      { label: "MAFAND-MT", value: 32414 },
      { label: "Inkuba", value: 30000 },
      { label: "SALT", value: 23947 },
    ],
  },
];

const shades = ["bg-signal", "bg-teal", "bg-ocean", "bg-lilac", "bg-other", "bg-white/25"];

const principles = [
  ["Informed consent", "People understand how their contributions will be collected, used, and shared."],
  ["Purpose limitation", "Data is collected and used for clearly defined research and development purposes."],
  [
    "Privacy protection",
    "Personal information is minimised and protected, with additional safeguards for sensitive contributions.",
  ],
  [
    "Community validation",
    "Language speakers and local experts help review terminology, interpretation, and contextual meaning.",
  ],
];

const CivicCorpusPage = () => {
  return (
    <>
      <PageHero
        eyebrow="Research / Civic Corpus"
        title="Understanding civic language in context."
        lede="Civic discourse is shaped by language, place, and lived experience. The Civic Corpus brings together language data, local terminology, and contextual knowledge to help AI systems interpret community expression beyond literal translation."
        tags={["CIVIC DISCOURSE", "TERMINOLOGY", "RESPONSIBLE DATA"]}
      >
        <div>
          <LinkButton href="/data-lab">Data Lab</LinkButton>
        </div>
      </PageHero>

      <Section id="scope">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow="Scope"
            title="The dimensions of civic discourse."
            lede="From everyday concerns to public decision-making, civic discourse reflects the issues, institutions, and experiences that shape community life."
            layout="split"
          />
          <CivicExplorer />
        </Container>
      </Section>

      <Section id="terminology" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow="Terminology"
            title="Beyond literal translation."
            lede="The terminology layer connects local expressions to shared civic concepts while preserving the linguistic and institutional context that gives them meaning."
            layout="split"
          />
          <TerminologyViewer />
        </Container>
      </Section>

      <Section id="composition" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow="Composition"
            title="The data behind the models."
            lede="Explore the language datasets used to develop and adapt CommonMind models, from parallel translation corpora to instruction-tuning resources."
            layout="split"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {mixtures.map((mix) => {
              const sum = mix.parts.reduce((a, p) => a + p.value, 0);
              return (
                <Panel key={mix.name} className="flex flex-col gap-6 p-7 sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-lg">{mix.name}</span>
                    <span className="font-mono text-xs text-faint">
                      {sum.toLocaleString("en-US")} {mix.unit}
                    </span>
                  </div>
                  <div className="flex h-2.5 gap-1">
                    {mix.parts.map((p, i) => (
                      <span
                        key={p.label}
                        className={cn("h-full rounded-full", shades[i])}
                        style={{ width: `${(p.value / sum) * 100}%` }}
                      />
                    ))}
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-faint">
                    {mix.parts.map((p, i) => (
                      <li key={p.label} className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", shades[i])} />
                        {p.label} · {p.value.toLocaleString("en-US")}
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section id="collection" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader eyebrow="Collection" title="Trust is part of the infrastructure." />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(([title, line]) => (
              <li key={title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                <span className="font-mono text-lg">{title}</span>
                <span className="text-sm text-faint">{line}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
};

export default CivicCorpusPage;
