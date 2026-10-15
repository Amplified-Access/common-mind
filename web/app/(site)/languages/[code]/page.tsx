import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { getLanguage, languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { LanguagePlayground } from "@/components/languages/language-playground";
import { modelCardData } from "@/components/models/catalog";
import { ModelCard } from "@/components/models/model-card";
import { cardColor, ColorCard } from "@/components/system/color-card";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { ArrowLink, LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { getContent } from "@/lib/content";
import { getPageCopy } from "@/lib/copy";
import { fill } from "@/lib/copy/fill";

type PageProps = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return languages.map((language) => ({ code: language.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const language = getLanguage(code);
  if (!language) return {};
  return { title: language.name, description: language.tagline };
}

const CONTRIBUTIONS = ["corpus", "terminology", "models", "benchmarks"] as const;

const LanguagePage = async ({ params }: PageProps) => {
  const { code } = await params;
  const language = getLanguage(code);
  if (!language) notFound();

  const [content, copy] = await Promise.all([getContent(), getPageCopy("languageDetail")]);
  const name = { name: language.name };
  const { models, research } = ecosystemFor(language, content);
  const languageData = content.datasets.filter((d) => d.languages.includes(language.name));
  const built = models.length > 0;

  return (
    <>
      <PageHero
        eyebrow={built ? copy.hero.eyebrowActive : copy.hero.eyebrowOpen}
        title={language.name}
        lede={language.tagline}
        tags={[language.family, language.branch, ...language.regions.slice(0, 2)]}
      />

      <Section id="about">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <SectionHeader
            eyebrow={copy.about.eyebrow}
            title={fill(copy.about.title, name)}
            lede={fill(copy.about.lede, name)}
            action={research[0] && <ArrowLink href={`/research/${research[0].slug}`}>{copy.about.researchCta}</ArrowLink>}
          />
          <InfoTable
            title={copy.about.tableTitle}
            ruled
            rows={[
              { label: "Endonym", value: language.endonym },
              { label: "Family", value: `${language.family} · ${language.branch}` },
              { label: "Script", value: language.script },
              { label: "Regions", value: language.regions.join(", ") },
              { label: "Open models", value: built ? String(models.length).padStart(2, "0") : undefined },
              { label: "Datasets", value: languageData.length ? String(languageData.length).padStart(2, "0") : undefined },
            ]}
          />
        </Container>
      </Section>

      {built ? (
        <>
          <Section id="models" className="pt-0 sm:pt-0">
            <Container className="flex flex-col gap-12">
              <SectionHeader eyebrow={copy.models.eyebrow} title={fill(copy.models.title, name)} />
              <ul className="grid gap-5 lg:grid-cols-2">
                {models.map((m) => (
                  <li key={m.slug} className="flex">
                    <ModelCard model={modelCardData(m)} className="w-full" />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          <Section id="corpus" className="pt-0 sm:pt-0">
            <Container className="flex flex-col gap-12">
              <SectionHeader eyebrow={copy.datasets.eyebrow} title={fill(copy.datasets.title, name)} />
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {languageData.map((d, i) => (
                  <li key={d.slug} className="flex">
                    <ColorCard
                      href={`/datasets/${d.slug}`}
                      title={d.name}
                      kind={`${d.kind} · ${d.source}`}
                      description={d.description}
                      cta={copy.datasets.cardCta}
                      color={cardColor(i)}
                      className="w-full"
                    />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          <Section id="try" className="border-t border-line">
            <Container className="flex flex-col gap-14">
              <LanguagePlayground initialModel={models[0].slug} />
            </Container>
          </Section>
        </>
      ) : (
        <Section id="contribute" className="pt-0 sm:pt-0">
          <Container className="flex flex-col gap-12">
            <SectionHeader
              eyebrow={copy.contribute.eyebrow}
              title={fill(copy.contribute.title, name)}
              lede={copy.contribute.lede}
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CONTRIBUTIONS.map((key) => (
                <li key={key} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                  <span className="font-mono text-lg">{copy.contribute[key].title}</span>
                  <span className="text-sm text-faint">{copy.contribute[key].text}</span>
                </li>
              ))}
            </ul>
            <div>
              <LinkButton href={content.settings.organization.href} arrow>
                {copy.contribute.cta}
              </LinkButton>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
};

export default LanguagePage;
