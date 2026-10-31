import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { accessSnippets } from "@/components/datasets/access";
import { servedLanguages, taskLabel } from "@/components/models/catalog";
import { registryModels } from "@/components/models/registry";
import { Arrow } from "@/components/system/arrow";
import { Code } from "@/components/system/code";
import { CodeTabs } from "@/components/system/code-tabs";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { ArrowLink, Eyebrow, Panel } from "@/components/system/primitives";
import { SideNav } from "@/components/system/side-nav";
import { TagChain } from "@/components/system/tag-chain";
import { copyFor, getContent } from "@/lib/content";
import { getPageCopy } from "@/lib/copy";
import { fill } from "@/lib/copy/fill";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getDataset = async (slug: string) =>
  (await getContent()).datasets.find((d) => d.slug === slug);

export async function generateStaticParams() {
  const { datasets } = await getContent();
  return datasets.map((dataset) => ({ slug: dataset.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDataset(slug);
  if (!dataset) return {};
  return {
    title: dataset.name,
    description: dataset.description,
    alternates: { canonical: `/datasets/${slug}` },
  };
}

const SECTIONS = ["overview", "data", "methodology", "usage", "models", "limitations", "versions"] as const;

// Placeholder copy until each dataset's documentation is written up.
const METHODOLOGY = ["collection", "processing", "annotation", "review"] as const;
const LIMITATIONS = ["known", "intended", "outOfScope", "representation"] as const;

const DatasetPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const dataset = await getDataset(slug);
  if (!dataset) notFound();

  const [content, copy] = await Promise.all([getContent(), getPageCopy("datasetDetail")]);
  const sections = SECTIONS.map((id) => ({ id, label: copy.nav[id] }));
  const models = registryModels
    .filter((m) => dataset.usedBy.includes(m.name))
    .map((m) => ({ ...m, tagline: copyFor(content, m.slug).tagline }));
  const languages = dataset.languages.join(", ");
  const access = accessSnippets(dataset);

  return (
    <>
      <PageHero
        ruled
        sideGrids
        eyebrow={fill(copy.hero.eyebrow, { kind: dataset.kind })}
        title={dataset.name}
        lede={dataset.description}
        tags={[...dataset.languages, dataset.kind, dataset.source]}
      />

      <section className="zoom-viewport relative py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[17rem_minmax(0,36rem)] lg:gap-24">
          <aside className="hidden lg:block">
            <SideNav items={sections} className="sticky top-24" />
          </aside>

          <div className="flex min-w-0 flex-col gap-24">
            <Block id="overview" eyebrow={copy.overview.eyebrow} title={copy.overview.title}>
              <p className="text-sm text-pretty text-faint">{dataset.description}</p>
              {models.length > 0 && (
                <p className="text-sm text-pretty text-faint">
                  {fill(copy.overview.usedBy, { models: models.map((m) => m.name).join(", ") })}
                </p>
              )}
              <InfoTable
                title={copy.overview.tableTitle}
                rows={[
                  { label: "Language", value: languages },
                  { label: "Data type", value: dataset.kind },
                  { label: "Domain", value: dataset.domains?.join(", ") },
                  { label: "Format" },
                  { label: "Size" },
                  { label: "Samples used", value: dataset.used },
                  { label: "Version" },
                  { label: "License" },
                  {
                    label: "Availability",
                    value: (
                      <a href={dataset.href} target="_blank" rel="noreferrer" className="hover:text-signal">
                        {dataset.source} ↗
                      </a>
                    ),
                  },
                ]}
              />
            </Block>

            <Block id="data" eyebrow={copy.data.eyebrow} title={copy.data.title} lede={copy.data.lede}>
              <Panel className="overflow-hidden">
                <h3 className="border-b border-line px-6 py-4 font-mono text-lg sm:px-10">{copy.data.previewTitle}</h3>
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="text-left">
                      {["ID", "Language", "Type", "Domain"].map((h) => (
                        <th key={h} className="px-6 pt-6 pb-3 font-normal uppercase first:pl-6 sm:first:pl-10">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-faint">
                    {[1, 2, 3, 4].map((n) => (
                      <tr key={n}>
                        <td className="px-6 py-1 sm:pl-10">{String(n).padStart(5, "0")}</td>
                        <td className="px-6 py-1">{dataset.languages[0] ?? "–"}</td>
                        <td className="px-6 py-1">{dataset.kind}</td>
                        <td className="px-6 py-1">{dataset.domains?.[(n - 1) % dataset.domains.length] ?? "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-6 pt-4 pb-6 font-mono text-xs text-faint sm:px-10">
                  {copy.data.previewNote}
                </p>
              </Panel>

              <div className="flex flex-col gap-6 pt-6">
                <h3 className="text-h3">{copy.data.representedTitle}</h3>
                <p className="text-sm text-faint">{copy.data.representedLede}</p>
                <dl className="grid grid-cols-2 gap-6 border-y border-line py-6 font-mono text-sm sm:grid-cols-4">
                  {[
                    ["Language", languages],
                    ["Data Type", dataset.kind],
                    ["Source", dataset.source],
                    ["Version", undefined],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-2">
                      <dt>{label}</dt>
                      <dd className="text-faint">{value ?? "–"}</dd>
                    </div>
                  ))}
                </dl>
                {dataset.domains && (
                  <div className="flex flex-col gap-4">
                    <span className="font-mono text-sm">{copy.data.domains}</span>
                    <TagChain tags={dataset.domains} />
                  </div>
                )}
              </div>
            </Block>

            <Block id="methodology" eyebrow={copy.methodology.eyebrow} title={copy.methodology.title} lede={copy.methodology.lede}>
              <ol className="flex flex-col gap-8 border-t border-line pt-10">
                {METHODOLOGY.map((key, i) => (
                  <li key={key} className="flex flex-col gap-2">
                    <span className="font-mono text-lg">
                      {String(i + 1).padStart(2, "0")} — {copy.methodology[key].title}
                    </span>
                    <span className="text-sm text-faint">{copy.methodology[key].text}</span>
                  </li>
                ))}
              </ol>
            </Block>

            <Block id="usage" eyebrow={copy.usage.eyebrow} title={fill(copy.usage.title, { name: dataset.name })} lede={copy.usage.lede}>
              <CodeTabs
                variant="box"
                tabs={[
                  ...access.map((snippet) => ({
                    id: snippet.id,
                    label: snippet.label,
                    content: <Code code={snippet.code} language={snippet.language} title={snippet.title} />,
                  })),
                  {
                    id: "documentation",
                    label: copy.usage.documentationTab,
                    content: (
                      <Panel className="flex flex-col gap-4 p-8">
                        <p className="text-sm text-faint">{copy.usage.documentationText}</p>
                        <ArrowLink href={dataset.href}>{copy.usage.readDocumentation}</ArrowLink>
                      </Panel>
                    ),
                  },
                ]}
              />
              <InfoTable
                title={copy.usage.detailsTitle}
                rows={[{ label: "Format" }, { label: "Version" }, { label: "License" }, { label: "Download Size" }]}
                footer={
                  <div className="flex flex-wrap gap-8 pt-4">
                    <ArrowLink href={dataset.href}>{copy.usage.download}</ArrowLink>
                    <ArrowLink href={dataset.href}>{copy.usage.readDocumentation}</ArrowLink>
                  </div>
                }
              />
            </Block>

            {models.length > 0 && (
              <Block id="models" eyebrow={copy.models.eyebrow} title={copy.models.title} lede={fill(copy.models.lede, { name: dataset.name })}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {models.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={`/models/${m.slug}`}
                        className="group flex h-full flex-col gap-5 rounded-card border border-line bg-surface p-7 transition-colors hover:border-signal/60"
                      >
                        <span className="text-xl">{m.name}</span>
                        <span className="text-sm text-faint">{m.tagline}.</span>
                        <TagChain tags={[...servedLanguages(m), taskLabel(m.task)]} size="sm" uppercase />
                        <span className="mt-auto inline-flex items-center gap-2 font-mono text-xs text-signal">
                          {copy.models.cardCta}
                          <Arrow direction="right" className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block id="limitations" eyebrow={copy.limitations.eyebrow} title={copy.limitations.title} lede={copy.limitations.lede}>
              <dl className="flex flex-col gap-8 border-t border-line pt-10">
                {LIMITATIONS.map((key) => (
                  <div key={key} className="flex flex-col gap-2">
                    <dt className="font-mono text-lg">{copy.limitations[key].title}</dt>
                    <dd className="text-sm text-faint">{copy.limitations[key].text}</dd>
                  </div>
                ))}
              </dl>
            </Block>

            <Block id="versions" eyebrow={copy.versions.eyebrow} title={copy.versions.title} lede={copy.versions.lede}>
              <Panel className="overflow-hidden">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      {["Version", "Released", "Status", "Notes"].map((h) => (
                        <th key={h} className="px-6 py-4 font-normal sm:first:pl-10">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-faint">
                    <tr>
                      <td className="px-6 py-4 sm:pl-10">–</td>
                      <td className="px-6 py-4">–</td>
                      <td className="px-6 py-4">{copy.versions.inUse}</td>
                      <td className="px-6 py-4">{dataset.used ?? "–"}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-6 pb-6 sm:px-10">
                  <ArrowLink href={dataset.href} arrow="right">
                    {copy.versions.releaseNotes}
                  </ArrowLink>
                </div>
              </Panel>
            </Block>
          </div>
        </Container>
      </section>
    </>
  );
};

function Block({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-6">
      <Eyebrow uppercase={false} className="text-base">
        {eyebrow}
      </Eyebrow>
      <h2 className="text-h2 text-balance">{title}</h2>
      {lede && <p className="text-sm text-pretty text-faint">{lede}</p>}
      <div className="flex flex-col gap-6 pt-4">{children}</div>
    </section>
  );
}

export default DatasetPage;
