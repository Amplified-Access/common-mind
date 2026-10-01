import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { languages } from "@/components/languages/data";
import { ecosystemFor } from "@/components/languages/ecosystem";
import { LanguageNetwork } from "@/components/languages/language-network";
import { PageHero } from "@/components/system/page-hero";
import { Section } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Languages",
  description: "Every language carries its own civic vocabulary.",
};

const LanguagesPage = () => {
  const entries = languages.map((language) => ({
    language,
    ...ecosystemFor(language),
  }));

  return (
    <>
      <PageHero
        title="Start with the language."
        lede="One language. An entire civic AI ecosystem."
      />

      <Section id="network" className="pt-8 sm:pt-12">
        <Container>
          <div className="rounded-3xl bg-surface px-4 py-10 sm:px-16 sm:py-16">
            <LanguageNetwork
              nodes={entries.map((e) => ({
                language: e.language,
                models: e.models.length,
                corpora: e.corpora.length,
              }))}
            />
          </div>
        </Container>
      </Section>

      <Section id="index" className="pt-0 sm:pt-0">
        <Container>
          <ul className="flex flex-col gap-2">
            {entries.map((e) => {
              const built = e.models.length > 0;
              return (
                <li key={e.language.code}>
                  <Link
                    href={`/languages/${e.language.code}`}
                    className="group -mx-6 grid grid-cols-[1fr_auto] items-baseline gap-x-8 gap-y-2 rounded-2xl px-6 py-7 transition-colors hover:bg-surface md:grid-cols-[1.4fr_1fr_1fr_auto]"
                  >
                    <span className="flex items-baseline gap-4">
                      <span
                        className={cn(
                          "size-2 shrink-0 -translate-y-1 rounded-full",
                          built ? "bg-signal" : "bg-white/20",
                        )}
                      />
                      <span className="text-3xl tracking-tight transition-colors group-hover:text-signal">
                        {e.language.name}
                      </span>
                    </span>
                    <span className="hidden text-subtle md:block">{e.language.branch}</span>
                    <span className="hidden text-subtle md:block">
                      {e.language.regions.slice(0, 2).join(", ")}
                    </span>
                    <span className="text-faint transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>
    </>
  );
};

export default LanguagesPage;
