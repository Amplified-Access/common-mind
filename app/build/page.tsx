import type { Metadata } from "next";

import { apiResponse, journey, paths, quickstart } from "@/components/build/snippets";
import { Container } from "@/components/common/container";
import { Code } from "@/components/system/code";
import { CodeTabs } from "@/components/system/code-tabs";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { ArrowLink, LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Build",
  description: "Open models, APIs, and deployment options for civic applications.",
};

const requestFields = [
  { label: "model_slug", value: "Identifier of the model to run" },
  { label: "text", value: "Input text, up to 500 characters" },
  { label: "direction", value: "Translation direction for supported models" },
];

const BuildPage = () => {
  return (
    <>
      <PageHero
        tile
        eyebrow="Build"
        title="Build with CommonMind."
        lede="From experimentation to production. Open models, APIs, and deployment tools for building multilingual AI applications grounded in civic discourse."
        tags={["OPEN MODELS", "APIs", "DEPLOYMENT"]}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="#journey">Get Started</LinkButton>
          <LinkButton href="#api" variant="outline">
            Read the Docs
          </LinkButton>
        </div>
      </PageHero>

      <Section id="quickstart">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeader
            eyebrow="Quickstart"
            title="From code to inference in minutes."
            lede="Load an open model with Transformers and PEFT to run English-to-Swahili translation locally."
          />
          <Code code={quickstart} language="python" title="quickstart.py" />
        </Container>
      </Section>

      <Section id="journey" className="border-t border-line">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            eyebrow="Developer Journey"
            title="Discover. Install. Run. Build. Deploy."
            lede="A clear path from exploring open models to integrating multilingual capabilities into real-world applications."
          />
          <CodeTabs
            tabs={journey.map((step) => ({
              id: step.id,
              label: step.label,
              content: (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
                  <p className="text-h3 text-pretty text-subtle">{step.copy}</p>
                  <Code code={step.code} language={step.lang} title={step.title} />
                </div>
              ),
            }))}
          />
        </Container>
      </Section>

      <Section id="paths" className="border-t border-line">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            eyebrow="Deployment"
            title="Built for your infrastructure."
            lede="Integrate CommonMind models into existing development environments, from local experimentation to production systems."
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-lg">{p.label}</span>
                <span className="text-sm text-faint">{p.copy}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="api" className="border-t border-line">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="flex flex-col gap-10">
            <SectionHeader
              eyebrow="API"
              title="One interface. Multiple models."
              lede="Access multilingual translation through a consistent API, with simple requests for model selection, text input, and language direction."
            />
            <InfoTable title="POST /translate" ruled rows={requestFields} />
            <ArrowLink href={site.links.huggingface}>Explore Model Cards</ArrowLink>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Code title="Request" language="bash" code={paths.find((p) => p.id === "api")!.code} />
            <Code title="Example response" language="json" code={apiResponse} />
          </div>
        </Container>
      </Section>
    </>
  );
};

export default BuildPage;
