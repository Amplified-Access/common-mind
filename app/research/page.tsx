import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { datasets } from "@/components/datasets/data";
import { formatDate } from "@/components/models/registry";
import { publications, readTimeForPublication } from "@/components/research/data";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Research",
  description: "Research at the intersection of language, civic discourse, models, data, and evaluation.",
};

const ResearchPage = () => {
  const reports = [...publications].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHero
        title="Advancing civic AI."
        lede="Civic language requires its own approach to AI."
      />

      <Section id="corpus" className="pt-8 sm:pt-12">
        <Container>
          <Link
            href="/research/civic-corpus"
            className="group flex flex-col gap-12 rounded-3xl bg-surface p-8 transition-colors hover:bg-surface-2 sm:p-14 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="flex max-w-xl flex-col gap-5">
              <h2 className="text-h2 text-balance">The civic corpus.</h2>
              <p className="text-lg text-subtle">
                The speech, data, and terminology behind the infrastructure.
              </p>
            </div>
            <p className="font-mono text-sm text-subtle sm:text-base">
              <span className="text-foreground">Olukiiko</span>
              <span className="px-3 text-faint">→</span>
              council
              <span className="px-3 text-faint">→</span>
              <span className="text-signal">local_government.body</span>
            </p>
          </Link>
        </Container>
      </Section>

      <Section id="papers">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Technical reports." />
          <ul className="flex flex-col gap-2">
            {reports.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/research/${p.slug}`}
                  className="group -mx-6 grid gap-3 rounded-2xl px-6 py-7 transition-colors hover:bg-surface md:grid-cols-[1fr_auto] md:items-baseline md:gap-16"
                >
                  <span className="text-2xl tracking-tight text-balance transition-colors group-hover:text-signal">
                    {p.title}
                  </span>
                  <span className="text-sm whitespace-nowrap text-faint">
                    {formatDate(p.date)} · {readTimeForPublication(p)} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="datasets">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Datasets." lede="Every source behind every model." />
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d) => (
              <li key={d.slug}>
                <a
                  href={d.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-1"
                >
                  <span className="text-lg tracking-tight transition-colors group-hover:text-signal">
                    {d.name} <span className="text-faint">↗</span>
                  </span>
                  <span className="text-sm text-faint">
                    {d.kind} · {d.source}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
};

export default ResearchPage;
