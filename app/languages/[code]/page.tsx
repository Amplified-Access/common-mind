import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { datasets } from "@/components/datasets/data";
import { getLanguage, languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { LanguagePlayground } from "@/components/languages/language-playground";
import { modelCardData } from "@/components/models/catalog";
import { ModelCard } from "@/components/models/model-card";
import { cardColor, ColorCard } from "@/components/system/color-card";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { ArrowLink, LinkButton, Section, SectionHeader } from "@/components/system/primitives";
import { site } from "@/lib/site";

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

const contributions = [
  ["Civic corpus", "Consented speech and text about public life."],
  ["Terminology", "How civic ideas are expressed, in context."],
  ["Models", "Small models that run on modest hardware."],
  ["Benchmarks", "Test sets reviewed by native speakers."],
];

const LanguagePage = async ({ params }: PageProps) => {
  const { code } = await params;
  const language = getLanguage(code);
  if (!language) notFound();

  const { models, research } = ecosystemFor(language);
  const languageData = datasets.filter((d) => d.languages.includes(language.name));
  const built = models.length > 0;

  return (
    <>
      <PageHero
        eyebrow={`Languages / ${built ? "Active" : "Open for contributors"}`}
        title={language.name}
        lede={language.tagline}
        tags={[language.family, language.branch, ...language.regions.slice(0, 2)]}
      />

      <Section id="about">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <SectionHeader
            eyebrow="Language"
            title={`${language.name} in civic contexts.`}
            lede={`The models, civic speech resources, benchmarks, and research being developed to help AI understand ${language.name}.`}
            action={research[0] && <ArrowLink href={`/research/${research[0].slug}`}>How it was built</ArrowLink>}
          />
          <InfoTable
            title="Language Information"
            ruled
            rows={[
              { label: "Endonym", value: language.endonym },
              { label: "Family", value: `${language.family} · ${language.branch}` },
              { label: "Script", value: language.script },
              { label: "Regions", value: language.regions.join(", ") },
              { label: "Models", value: built ? String(models.length).padStart(2, "0") : undefined },
              { label: "Datasets", value: languageData.length ? String(languageData.length).padStart(2, "0") : undefined },
            ]}
          />
        </Container>
      </Section>

      {built ? (
        <>
          <Section id="models" className="pt-0 sm:pt-0">
            <Container className="flex flex-col gap-12">
              <SectionHeader eyebrow="Models" title={`Models for ${language.name}.`} />
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
              <SectionHeader eyebrow="Data" title={`Datasets for ${language.name}.`} />
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {languageData.map((d, i) => (
                  <li key={d.slug} className="flex">
                    <ColorCard
                      href={`/datasets/${d.slug}`}
                      title={d.name}
                      kind={`${d.kind} · ${d.source}`}
                      description={d.description}
                      cta="View Dataset"
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
              eyebrow="Contribute"
              title={`Help build ${language.name}.`}
              lede="Every ecosystem starts with the people who speak the language."
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {contributions.map(([title, line]) => (
                <li key={title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                  <span className="font-mono text-lg">{title}</span>
                  <span className="text-sm text-faint">{line}</span>
                </li>
              ))}
            </ul>
            <div>
              <LinkButton href={site.org.href} arrow>
                Get involved
              </LinkButton>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
};

export default LanguagePage;
