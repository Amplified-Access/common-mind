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
      <section className="zoom-viewport relative isolate overflow-hidden border-b border-line pt-(--header-height)">
        <Backdrop wash grain stars shade />
        {/* The fine grid, showing only toward the sides and
            fading out before the bottom, as in the mock. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-grid [--grid-line:rgb(255_255_255/0.12)] [mask-composite:intersect] mask-[linear-gradient(to_right,#000,transparent_22%,transparent_78%,#000),linear-gradient(to_bottom,#000_55%,transparent)]"
        />
        <Container className="flex flex-col gap-10 pt-12 pb-14 sm:pt-13 sm:pb-16">
          <Eyebrow className="self-center">Languages</Eyebrow>
          {/* The copy and the globe sit as one centered pair. */}
          <div className="flex flex-col items-center gap-14 lg:flex-row lg:justify-center lg:gap-25 lg:pl-10">
            <div className="flex w-full flex-col gap-4 lg:w-75 lg:shrink-0">
              <h1 className="max-w-62 text-h2">Explore civic AI by language.</h1>
              <p className="max-w-75 text-[13px] leading-[1.2] text-pretty text-faint">
                One language. An entire civic AI ecosystem. Explore the models, civic speech
                resources, benchmarks, terminology, and research being built around each
                supported language.
              </p>
              <dl className="grid grid-cols-[11rem_auto] gap-y-6 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse gap-1">
                    <dt className="font-mono text-[13px]">{stat.label}</dt>
                    <dd className="font-mono text-[1.625rem] leading-tight text-signal">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <LanguageGlobe
              languages={languages.map(({ code, name, location }) => ({ code, name, location }))}
              className="w-full max-w-md shrink-0 lg:w-md"
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
