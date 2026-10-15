import { TerminalIcon } from "@hugeicons/core-free-icons";

import { apiResponse, journey, paths, quickstart } from "@/components/build/snippets";
import { Container } from "@/components/common/container";
import { Code } from "@/components/system/code";
import { CodeTabs } from "@/components/system/code-tabs";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { ArrowLink, LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { getPageCopy, pageMetadata } from "@/lib/copy";
import { site } from "@/lib/site";

export const generateMetadata = () => pageMetadata("build");

const BuildPage = async () => {
  const copy = await getPageCopy("build");
  const requestFields = [
    { label: "model_slug", value: copy.api.modelSlug },
    { label: "text", value: copy.api.text },
    { label: "direction", value: copy.api.direction },
  ];
  return (
    <>
      <PageHero
        tile={TerminalIcon}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lede={copy.hero.lede}
        tags={copy.hero.tags}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="#journey">{copy.hero.primaryCta}</LinkButton>
          <LinkButton href="#api" variant="outline">
            {copy.hero.secondaryCta}
          </LinkButton>
        </div>
      </PageHero>

      <Section id="quickstart">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeader
            eyebrow={copy.quickstart.eyebrow}
            title={copy.quickstart.title}
            lede={copy.quickstart.lede}
          />
          <Code code={quickstart} language="python" title="quickstart.py" />
        </Container>
      </Section>

      <Section id="journey" className="border-t border-line">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            eyebrow={copy.journey.eyebrow}
            title={copy.journey.title}
            lede={copy.journey.lede}
          />
          <CodeTabs
            tabs={journey.map((step) => ({
              id: step.id,
              label: copy.journey[step.id].label,
              content: (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
                  <p className="text-h3 text-pretty text-subtle">{copy.journey[step.id].text}</p>
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
            eyebrow={copy.paths.eyebrow}
            title={copy.paths.title}
            lede={copy.paths.lede}
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-lg">{copy.paths[p.id].label}</span>
                <span className="text-sm text-faint">{copy.paths[p.id].text}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="api" className="border-t border-line">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="flex flex-col gap-10">
            <SectionHeader
              eyebrow={copy.api.eyebrow}
              title={copy.api.title}
              lede={copy.api.lede}
            />
            <InfoTable title="POST /translate" ruled rows={requestFields} />
            <ArrowLink href={site.links.huggingface}>{copy.api.cta}</ArrowLink>
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
