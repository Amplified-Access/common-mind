import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { formatDate } from "@/components/models/registry";
import { releases } from "@/components/research/data";
import { researchItems } from "@/components/research/items";
import { ResearchGrid } from "@/components/research/research-grid";
import { Arrow } from "@/components/system/arrow";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Research",
  description: "Research at the intersection of language, civic discourse, models, data, and evaluation.",
};

const ResearchPage = () => {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Understanding civic speech."
        lede="Research into the language, data, models, and evaluation methods needed to build AI that better understands civic expression across languages beyond the mainstream."
        tags={["CIVIC AI", "LANGUAGE", "OPEN RESEARCH"]}
        className="pb-(--section-pad)"
        after={
          <Container id="papers" className="scroll-mt-24">
            <ResearchGrid items={researchItems()} />
          </Container>
        }
      />

      <Section id="releases">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow="Releases"
            title="Every release, in order."
            lede="Civic language requires its own approach to AI. Each model ships with its weights, its evaluation, and a report on how it was built."
          />
          <ol className="flex flex-col border-t border-line">
            {releases.map((release) => (
              <li key={release.date} className="border-b border-line">
                <Link
                  href={release.href}
                  className="group grid gap-3 py-7 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:items-baseline md:gap-10"
                >
                  <time dateTime={release.date} className="font-mono text-sm text-faint uppercase">
                    {formatDate(release.date)}
                  </time>
                  <span className="flex flex-col gap-2">
                    <span className="text-xl transition-colors group-hover:text-signal">{release.title}</span>
                    <span className="max-w-2xl text-sm text-faint">{release.description}</span>
                  </span>
                  <Arrow className="hidden text-signal transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:block" />
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </>
  );
};

export default ResearchPage;
