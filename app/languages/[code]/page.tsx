import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { Chevron } from "@/components/system/chevron";
import { getLanguage, languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { Translator } from "@/components/playground/translator";
import {
  LinkButton,
  MetaGrid,
  Section,
  SectionHeader,
} from "@/components/system/primitives";
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

const LanguagePage = async ({ params }: PageProps) => {
  const { code } = await params;
  const language = getLanguage(code);
  if (!language) notFound();

  const { models, corpora, research } = ecosystemFor(language);
  const built = models.length > 0;

  return (
    <>
      <section>
        <Container className="flex flex-col gap-20 pt-20 pb-8 sm:pt-28">
          <div className="flex flex-col gap-8">
            <Link
              href="/languages"
              className="inline-flex items-center gap-1 self-start text-sm text-faint transition-colors hover:text-foreground"
            >
              <Chevron direction="left" />
              Languages
            </Link>
            <h1 className="text-display">{language.name}</h1>
            <p className="max-w-2xl text-lg text-pretty text-subtle sm:text-xl">
              {language.tagline}
            </p>
          </div>
          <MetaGrid
            className="lg:grid-cols-4"
            items={[
              { label: "Endonym", value: language.endonym },
              { label: "Family", value: `${language.family} · ${language.branch}` },
              { label: "Script", value: language.script },
              { label: "Regions", value: language.regions.join(", ") },
            ]}
          />
        </Container>
      </section>

      {built ? (
        <>
          <Section id="models">
            <Container className="flex flex-col gap-16">
              <SectionHeader title="Models." />
              <ul className="flex flex-col gap-2">
                {models.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/models/${m.slug}`}
                      className="group -mx-6 grid grid-cols-[1fr_auto] items-baseline gap-8 rounded-2xl px-6 py-6 transition-colors hover:bg-surface"
                    >
                      <span className="flex flex-col gap-1">
                        <span className="text-xl tracking-tight transition-colors group-hover:text-signal">
                          {m.name}
                        </span>
                        <span className="text-subtle">{m.directions.join(", ")}</span>
                      </span>
                      <span className="text-right tabular-nums">
                        <span className="text-2xl">{m.evaluation.bleu.toFixed(2)}</span>
                        <span className="block text-sm text-faint">BLEU</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          <Section id="corpus">
            <Container className="flex flex-col gap-16">
              <SectionHeader title="Trained on." />
              <ul className="flex flex-wrap gap-3">
                {corpora.map((d) => (
                  <li key={d.slug}>
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-surface px-5 py-2.5 text-sm text-subtle transition-colors hover:text-foreground"
                    >
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
              {research[0] && (
                <Link
                  href={`/research/${research[0].slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-signal"
                >
                  How it was built
                  <Chevron />
                </Link>
              )}
            </Container>
          </Section>

          <Section id="try">
            <Container className="flex flex-col gap-16">
              <SectionHeader title={`Try ${language.name}.`} />
              <Translator initialModel={models[0].slug} />
            </Container>
          </Section>
        </>
      ) : (
        <Section id="contribute">
          <Container className="flex flex-col gap-16">
            <SectionHeader
              title={`Help build ${language.name}.`}
              lede="Every ecosystem starts with the people who speak the language."
            />
            <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Civic corpus", "Consented speech and text about public life."],
                ["Terminology", "How civic ideas are expressed, in context."],
                ["Models", "Small models that run on modest hardware."],
                ["Benchmarks", "Test sets reviewed by native speakers."],
              ].map(([title, line]) => (
                <li key={title} className="flex flex-col gap-3">
                  <span className="text-xl tracking-tight">{title}</span>
                  <span className="text-subtle">{line}</span>
                </li>
              ))}
            </ul>
            <div>
              <LinkButton href={site.org.href}>Get involved</LinkButton>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
};

export default LanguagePage;
