import { Container } from "@/components/common/container";
import { languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { LanguageGlobe } from "@/components/languages/language-globe";
import { LanguageGrid } from "@/components/languages/language-grid";
import { Backdrop } from "@/components/system/backdrop";
import { Eyebrow, Section, SectionHeader } from "@/components/system/primitives";
import { getContent } from "@/lib/content";
import { getPageCopy, pageMetadata } from "@/lib/copy";

export const generateMetadata = () => pageMetadata("languages");

const LanguagesPage = async () => {
  const [content, copy] = await Promise.all([getContent(), getPageCopy("languages")]);
  const { datasets } = content;
  const entries = languages.map((language) => {
    const { models } = ecosystemFor(language, content);
    return {
      code: language.code,
      name: language.name,
      endonym: language.endonym,
      family: language.family,
      branch: language.branch,
      regions: language.regions,
      tagline: language.tagline,
      models: models.length,
      datasets: datasets.filter((d) => d.languages.includes(language.name)).length,
    };
  });

  const { stats } = copy;

  return (
    <>
      <section className="zoom-viewport relative isolate overflow-hidden border-b border-line pt-(--header-height)">
        <Backdrop wash grain stars shade sideGrids />
        <Container className="flex flex-col gap-10 pt-12 pb-14 sm:pt-13 sm:pb-16">
          <Eyebrow className="self-center">{copy.hero.eyebrow}</Eyebrow>
          {/* The copy and the globe sit as one centered pair. */}
          <div className="flex flex-col items-center gap-14 lg:flex-row lg:justify-center lg:gap-25 lg:pl-10">
            <div className="flex w-full flex-col gap-4 lg:w-75 lg:shrink-0">
              <h1 className="max-w-62 text-h2">{copy.hero.title}</h1>
              <p className="max-w-75 text-[13px] leading-[1.2] text-pretty text-faint">
                {copy.hero.lede}
              </p>
              <dl className="grid grid-cols-[11rem_auto] gap-y-6 pt-4">
                {[stats.languages, stats.countries, stats.datasets, stats.models].map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse gap-1">
                    <dt className="font-mono text-[13px]">{stat.label}</dt>
                    <dd className="font-mono text-[1.625rem] leading-tight text-signal">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <LanguageGlobe
              languages={languages.map(({ code, location }) => ({ code, location }))}
              className="w-full max-w-md shrink-0 lg:w-md"
            />
          </div>
        </Container>
      </section>

      <Section id="index">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            title={copy.index.title}
            lede={copy.index.lede}
          />
          <LanguageGrid entries={entries} />
        </Container>
      </Section>
    </>
  );
};

export default LanguagesPage;
