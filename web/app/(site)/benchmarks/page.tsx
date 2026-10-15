import { Analytics01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

import { radarScores } from "@/components/benchmarks/civicbench-preview";
import { ComparePanel } from "@/components/benchmarks/compare-panel";
import {
  civicBench,
  lugandaFloresReferences,
  lugandaHeldOut,
  swahiliFlores,
} from "@/components/benchmarks/data";
import { EfficiencyChart } from "@/components/benchmarks/efficiency-chart";
import { RadarChart, type RadarModel } from "@/components/benchmarks/radar-chart";
import { Container } from "@/components/common/container";
import { registryModels } from "@/components/models/registry";
import { Translator } from "@/components/playground/translator";
import { Arrow } from "@/components/system/arrow";
import { CountUp } from "@/components/system/count-up";
import { FramedCard, HALO } from "@/components/system/framed-card";
import { PageHero } from "@/components/system/page-hero";
import { Eyebrow, Panel, Section, SectionHeader } from "@/components/system/primitives";
import { getPageCopy, pageMetadata } from "@/lib/copy";
import { cn } from "@/lib/utils";

export const generateMetadata = () => pageMetadata("benchmarks");

const BenchmarksPage = async () => {
  const copy = await getPageCopy("benchmarks");
  const adapted = registryModels.filter((m) => m.evaluation.baseBleu !== undefined);
  const radarModels: RadarModel[] = registryModels.flatMap((m) => {
    const scores = radarScores(m.slug, m.evaluation.chrf);
    return scores ? [{ slug: m.slug, name: m.name, scores }] : [];
  });

  return (
    <>
      <PageHero
        tile={Analytics01Icon}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lede={copy.hero.lede}
        tags={copy.hero.tags}
      />

      <Section id="results" className="isolate pt-6 sm:pt-8">
        {/* The fine grid behind the panel's top, reaching up under the hero's
            tags and fading down the gutters. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[28rem] bg-grid bg-grid-wide [--grid-line:rgb(255_255_255/0.08)] mask-[linear-gradient(to_bottom,transparent,#000_25%,#000_45%,transparent)]"
        />
        <Container className="relative isolate">
          <div
            aria-hidden
            className={cn(
              HALO,
              "inset-x-4 inset-y-0 md:inset-x-8 xl:inset-x-12",
            )}
          />
          <FramedCard panelsClassName="flex flex-col gap-20 bg-[#0b0a07] px-6 py-12 sm:px-12 sm:py-14">
            <div className="flex flex-col gap-10">
              <SectionHeader
                title={copy.results.title}
                lede={copy.results.lede}
              />
              <ComparePanel
                sets={[
                  {
                    id: "sw",
                    from: "English",
                    to: "Swahili",
                    primary: swahiliFlores,
                  },
                  {
                    id: "lg",
                    from: "English",
                    to: "Luganda",
                    primary: lugandaHeldOut,
                    references: lugandaFloresReferences,
                  },
                ]}
              />
            </div>

            <div id="compare" className="flex scroll-mt-24 flex-col gap-10">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-h2">{copy.compare.title}</h3>
                  <span className="rounded-full border border-signal/60 px-3 py-0.5 font-mono text-[11px] text-signal uppercase">
                    {copy.compare.badge}
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-faint">
                  {copy.compare.lede}
                </p>
              </div>
              <RadarChart
                models={radarModels}
                initial={radarModels.slice(0, 3).map((m) => m.slug)}
              />
            </div>
          </FramedCard>
        </Container>
      </Section>

      <Section id="civicbench">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow={copy.civicBench.eyebrow}
            title={copy.civicBench.title}
            lede={copy.civicBench.lede}
            layout="split"
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {civicBench.map((c, i) => (
              <li
                key={c.id}
                className="flex flex-col gap-4 rounded-card border border-line bg-surface p-7"
              >
                <span className="font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xl tracking-tight">{c.name}</span>
                <span className="text-sm text-faint">{c.measures}</span>
                <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                  <span className="font-mono text-xs text-signal">
                    {c.metric}
                  </span>
                  {c.results ? (
                    <Link
                      href={c.results}
                      className="inline-flex items-center gap-2 font-mono text-xs text-foreground hover:text-signal"
                    >
                      {copy.civicBench.resultsLink} <Arrow />
                    </Link>
                  ) : (
                    <span className="font-mono text-xs text-faint">
                      {copy.civicBench.inDevelopment}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="adaptation" className="border-t border-line">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            eyebrow={copy.adaptation.eyebrow}
            title={copy.adaptation.title}
            lede={copy.adaptation.lede}
          />
          <div className="grid gap-5 md:grid-cols-2">
            {adapted.map((m, i) => (
              <Link
                key={m.slug}
                href={`/models/${m.slug}`}
                className="group flex flex-col gap-4 rounded-card border border-line bg-surface p-8 transition-colors hover:border-signal/60"
              >
                <span className="flex items-baseline gap-4 font-mono tabular-nums">
                  <CountUp
                    value={m.evaluation.baseBleu!}
                    delay={i * 0.1}
                    className="text-2xl text-faint"
                  />
                  <span className="text-2xl text-faint">→</span>
                  <CountUp
                    value={m.evaluation.bleu}
                    delay={i * 0.1}
                    className="text-6xl text-signal transition-colors group-hover:text-foreground"
                  />
                </span>
                <span className="text-sm text-subtle">
                  {m.languageNames[0]} · BLEU · {m.evaluation.short}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="efficiency">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:items-center lg:gap-20">
          <SectionHeader
            eyebrow={copy.efficiency.eyebrow}
            title={copy.efficiency.title}
            lede={copy.efficiency.lede}
          />
          <Panel className="p-6 sm:p-10">
            <EfficiencyChart entries={swahiliFlores.entries} />
          </Panel>
        </Container>
      </Section>

      <Section id="methodology">
        <Container className="flex flex-col gap-14">
          <SectionHeader eyebrow={copy.methodology.eyebrow} title={copy.methodology.title} />
          <div className="grid gap-5 md:grid-cols-3">
            <MethodNote title={copy.methodology.metricsTitle}>{copy.methodology.metrics}</MethodNote>
            <MethodNote title={copy.methodology.standardisedTitle}>
              {copy.methodology.standardised}
            </MethodNote>
            <MethodNote title={copy.methodology.reproducibleTitle}>
              {copy.methodology.reproducible}
            </MethodNote>
          </div>
        </Container>
      </Section>

      <Section id="try" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>{copy.playground.eyebrow}</Eyebrow>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-12">
              <h2 className="text-h2">{copy.playground.title}</h2>
              <p className="max-w-60 text-sm text-foreground/85">{copy.playground.lede}</p>
            </div>
          </div>
          <Translator />
        </Container>
      </Section>
    </>
  );
};

function MethodNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
      <h3 className="font-mono text-lg">{title}</h3>
      <p className="text-sm text-faint">{children}</p>
    </div>
  );
}

export default BenchmarksPage;
