import type { Metadata } from "next";

import { journey, paths, quickstart } from "@/components/build/snippets";
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
  { label: "model_slug", value: "Which model to run" },
  { label: "text", value: "Up to 500 characters" },
  { label: "direction", value: "en-lg or lg-en, Luganda only" },
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
          <SectionHeader eyebrow="Journey" title="Discover. Install. Run. Build. Deploy." />
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
            title="Use the stack you already have."
            lede="Every model ships to the tools developers already use, from a notebook to a CPU at the edge."
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
            <SectionHeader eyebrow="API" title="POST /translate" lede="One endpoint for every model." />
            <InfoTable title="Request" ruled rows={requestFields} />
            <ArrowLink href={site.links.huggingface}>Model cards on Hugging Face</ArrowLink>
          </div>
          <Code title="request" language="bash" code={paths.find((p) => p.id === "api")!.code} />
        </Container>
      </Section>
    </>
  );
};

export default BuildPage;
