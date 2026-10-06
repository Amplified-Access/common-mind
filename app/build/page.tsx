import type { Metadata } from "next";

import { journey, paths, quickstart } from "@/components/build/snippets";
import { Container } from "@/components/common/container";
import { Code } from "@/components/system/code";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { Tabs } from "@/components/system/tabs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Build",
  description: "Open models, APIs, and deployment options for civic applications.",
};

const requestFields = [
  ["model_slug", "Which model to run"],
  ["text", "Up to 500 characters"],
  ["direction", "en-lg or lg-en, Luganda only"],
];

const BuildPage = () => {
  return (
    <>
      <PageHero tile eyebrow="Build" title="Build with CommonMind." lede="From first prompt to production.">
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="#journey">Get started</LinkButton>
          <LinkButton href="#api" variant="outline">
            Read the docs
          </LinkButton>
        </div>
      </PageHero>

      <Section id="quickstart" className="pb-0 sm:pb-0">
        <Container>
          <Code code={quickstart} language="python" title="quickstart.py" />
        </Container>
      </Section>

      <Section id="journey">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Discover. Install. Run. Build. Deploy." />
          <Tabs
            items={journey.map((step) => ({
              id: step.id,
              label: step.label,
              content: (
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
                  <p className="text-xl text-pretty text-subtle">{step.copy}</p>
                  <Code code={step.code} language={step.lang} title={step.title} />
                </div>
              ),
            }))}
          />
        </Container>
      </Section>

      <Section id="paths">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="Use the stack you already have." />
          <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <span className="text-xl tracking-tight">{p.label}</span>
                <span className="text-subtle">{p.copy}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="api">
        <Container className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-24">
          <div className="flex flex-col gap-12">
            <SectionHeader title="POST /translate" />
            <dl className="flex flex-col gap-6">
              {requestFields.map(([field, meaning]) => (
                <div key={field} className="flex flex-col gap-1">
                  <dt className="font-mono text-sm text-signal">{field}</dt>
                  <dd className="text-subtle">{meaning}</dd>
                </div>
              ))}
            </dl>
            <a
              href={site.links.huggingface}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium transition-colors hover:text-signal"
            >
              Model cards on Hugging Face ↗
            </a>
          </div>
          <Code
            title="request"
            language="bash"
            code={paths.find((p) => p.id === "api")!.code}
          />
        </Container>
      </Section>
    </>
  );
};

export default BuildPage;
