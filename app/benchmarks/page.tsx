import type { Metadata } from "next";
import Link from "next/link";

import { BarChart } from "@/components/benchmarks/bar-chart";
import {
  civicBench,
  lugandaFloresReferences,
  lugandaHeldOut,
  swahiliFlores,
} from "@/components/benchmarks/data";
import { EfficiencyChart } from "@/components/benchmarks/efficiency-chart";
import { Container } from "@/components/common/container";
import { registryModels } from "@/components/models/registry";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { Tabs } from "@/components/system/tabs";

export const metadata: Metadata = {
  title: "Benchmarks",
  description: "Reliable evaluation for civic AI. CivicBench Africa and published results.",
};

const BenchmarksPage = () => {
  const adapted = registryModels.filter((m) => m.evaluation.baseBleu !== undefined);

  return (
    <>
      <PageHero
        title="Measure what improves."
        lede="What gets measured gets improved."
        actions={<LinkButton href="#results">See results</LinkButton>}
      />

      <Section id="civicbench">
        <Container className="flex flex-col gap-20">
          <SectionHeader
            title="CivicBench Africa."
            lede="Nine tests of how well a model understands civic speech."
          />
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {civicBench.map((c) => (
              <li key={c.id} className="flex flex-col gap-2">
                <span className="text-xl tracking-tight">
                  {c.results ? (
                    <Link href={c.results} className="text-signal hover:underline">
                      {c.name} →
                    </Link>
                  ) : (
                    c.name
                  )}
                </span>
                <span className="text-sm text-faint">{c.metric}</span>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="results">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="How the models compare." />
          <Tabs
            items={[
              {
                id: "sw",
                label: "English → Swahili",
                content: (
                  <div className="flex flex-col gap-10">
                    <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
                      <BarChart title="BLEU" entries={swahiliFlores.entries} metric="bleu" />
                      <BarChart title="chrF++" entries={swahiliFlores.entries} metric="chrf" />
                    </div>
                    <p className="text-sm text-faint">{swahiliFlores.evalSet}</p>
                  </div>
                ),
              },
              {
                id: "lg",
                label: "English ↔ Luganda",
                content: (
                  <div className="flex flex-col gap-20">
                    <div className="flex flex-col gap-10">
                      <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
                        <BarChart title="BLEU" entries={lugandaHeldOut.entries} metric="bleu" />
                        <BarChart title="chrF++" entries={lugandaHeldOut.entries} metric="chrf" />
                      </div>
                      <p className="text-sm text-faint">{lugandaHeldOut.evalSet}</p>
                    </div>
                    <div className="flex flex-col gap-10 lg:max-w-[calc(50%-2.5rem)]">
                      <BarChart
                        title="Published references, FLORES-200"
                        entries={lugandaFloresReferences.entries}
                        metric="bleu"
                      />
                      <p className="text-sm text-faint">{lugandaFloresReferences.note}</p>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Container>
      </Section>

      <Section id="adaptation">
        <Container className="flex flex-col gap-20">
          <SectionHeader
            title="Same base model. Different language."
            lede="Gemma 3 1B, before and after civic adaptation."
          />
          <div className="grid gap-16 md:grid-cols-2">
            {adapted.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="group flex flex-col gap-4">
                <span className="flex items-baseline gap-4 tabular-nums">
                  <span className="text-3xl text-faint">{m.evaluation.baseBleu!.toFixed(2)}</span>
                  <span className="text-3xl text-faint">→</span>
                  <span className="text-7xl font-medium tracking-tight transition-colors group-hover:text-signal">
                    {m.evaluation.bleu.toFixed(2)}
                  </span>
                </span>
                <span className="text-subtle">
                  {m.languageNames[0]} · BLEU · {m.evaluation.short}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="efficiency">
        <Container className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:items-center lg:gap-24">
          <SectionHeader
            title="Small models, measured."
            lede="A 615M-parameter model outscores Gemma 3 27B on English→Swahili."
          />
          <div className="rounded-3xl bg-surface p-6 sm:p-10">
            <EfficiencyChart entries={swahiliFlores.entries} />
          </div>
        </Container>
      </Section>

      <Section id="methodology">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="Methodology." />
          <div className="grid gap-12 md:grid-cols-3 md:gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl tracking-tight">Metrics</h3>
              <p className="text-subtle">
                BLEU for exact overlap. chrF++ for character-level accuracy,
                fairer to rich morphology.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl tracking-tight">Shared test sets</h3>
              <p className="text-subtle">
                Models are only compared on the same set. Swahili on FLORES-200;
                Luganda on a held-out split.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl tracking-tight">Cited sources</h3>
              <p className="text-subtle">
                Third-party figures are published by{" "}
                <a
                  href="https://huggingface.co/CraneAILabs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground hover:text-signal"
                >
                  Crane AI Labs
                </a>{" "}
                and linked from every chart row.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
};

export default BenchmarksPage;
