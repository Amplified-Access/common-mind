import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { datasets } from "@/components/datasets/data";
import { languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { LanguageGlobe } from "@/components/languages/language-globe";
import { LanguageGrid } from "@/components/languages/language-grid";
import { registryModels } from "@/components/models/registry";
import { Backdrop } from "@/components/system/backdrop";
import { Eyebrow, Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Languages",
  description: "Every language carries its own civic vocabulary.",
};

const LanguagesPage = () => {
  const entries = languages.map((language) => {
    const { models } = ecosystemFor(language);
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

  const stats = [
    { value: languages.length, label: "Languages" },
    { value: new Set(languages.flatMap((l) => l.regions)).size, label: "Countries" },
    { value: datasets.length, label: "Datasets" },
    { value: registryModels.length, label: "Open models" },
  ];

  return (
    <>
      <section className="zoom-viewport relative isolate overflow-hidden border-b border-line">
        <Backdrop wash grain grid stars />
        <Container className="flex flex-col gap-10 pt-14 pb-16 sm:pt-16 sm:pb-20">
          <Eyebrow className="self-center text-sm">Languages</Eyebrow>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5 lg:pl-[12%]">
              <h1 className="text-h2 max-w-sm text-balance">Explore civic AI by language.</h1>
              <p className="max-w-sm text-sm text-pretty text-faint">
                One language. An entire civic AI ecosystem. Explore the models, civic speech
                resources, benchmarks, terminology, and research being built around each
                supported language.
              </p>
              <dl className="grid max-w-sm grid-cols-2 gap-x-10 gap-y-7 pt-5">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse gap-1.5">
                    <dt className="font-mono text-sm">{stat.label}</dt>
                    <dd className="font-mono text-3xl text-signal">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <LanguageGlobe
              markers={languages.map((l) => l.location)}
              className="mx-auto w-full max-w-md"
            />
          </div>
        </Container>
      </section>

      <Section id="index">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            title="Explore Supported Languages"
            lede="Each language connects to its own growing ecosystem of models, civic speech data, evaluation, terminology, and research."
          />
          <LanguageGrid entries={entries} />
        </Container>
      </Section>
    </>
  );
};

export default LanguagesPage;
