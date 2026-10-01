import type { Metadata } from "next";

import { TerminologyViewer } from "@/components/civic/terminology-viewer";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Civic corpus",
  description: "The civic speech, data, and terminology behind CommonMind.",
};

const categories = [
  "Community problems",
  "Public services",
  "Local government",
  "Elections",
  "Corruption & accountability",
  "Civic rights",
  "Public meetings",
  "Political promises",
  "Local development",
  "Citizen feedback",
];

// Training mixtures as reported in each technical report.
const mixtures = [
  {
    name: "Swahili-gemma-1B-it",
    total: "159,311 examples",
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
    total: "145,707 pairs",
    parts: [
      { label: "Rogendo", value: 60000 },
      { label: "MAFAND-MT", value: 32414 },
      { label: "Inkuba", value: 30000 },
      { label: "SALT", value: 23947 },
    ],
  },
];

const shades = ["bg-signal", "bg-signal/55", "bg-white/40", "bg-white/25", "bg-white/14", "bg-white/8"];

const principles = [
  ["Consent first", "People know how a recording will be used before it is made."],
  ["Purpose-bound", "Collected to help AI understand civic speech."],
  ["Anonymous", "Speaker identity is held apart from what was said."],
  ["Community-reviewed", "Speakers of each language review its terminology."],
];

const CivicCorpusPage = () => {
  return (
    <>
      <PageHero
        title="The civic speech behind the infrastructure."
        lede="Civic language is highly contextual. It rarely translates literally."
      />

      <Section id="scope">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Ten categories of civic speech." />
          <ul className="grid gap-x-10 gap-y-5 text-xl tracking-tight text-foreground/85 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="terminology">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            title="Expression → English → civic concept."
            lede="The terminology layer keeps the context that literal translation loses."
          />
          <TerminologyViewer />
        </Container>
      </Section>

      <Section id="composition">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="What the models learned from." />
          <div className="flex flex-col gap-14">
            {mixtures.map((mix) => {
              const sum = mix.parts.reduce((a, p) => a + p.value, 0);
              return (
                <div key={mix.name} className="flex flex-col gap-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-lg tracking-tight">{mix.name}</span>
                    <span className="text-sm text-faint">{mix.total}</span>
                  </div>
                  <div className="flex h-2 gap-1">
                    {mix.parts.map((p, i) => (
                      <span
                        key={p.label}
                        className={cn("h-full rounded-full", shades[i])}
                        style={{ width: `${(p.value / sum) * 100}%` }}
                      />
                    ))}
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-faint">
                    {mix.parts.map((p, i) => (
                      <li key={p.label} className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", shades[i])} />
                        {p.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section id="collection">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Trust is part of the infrastructure." />
          <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(([title, line]) => (
              <li key={title} className="flex flex-col gap-3">
                <span className="text-xl tracking-tight">{title}</span>
                <span className="text-subtle">{line}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
};

export default CivicCorpusPage;
