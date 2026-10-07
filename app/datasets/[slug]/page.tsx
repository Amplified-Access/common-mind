import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { accessSnippets } from "@/components/datasets/access";
import { datasets } from "@/components/datasets/data";
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

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getDataset = (slug: string) => datasets.find((d) => d.slug === slug);

export function generateStaticParams() {
  return datasets.map((dataset) => ({ slug: dataset.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset) return {};
  return { title: dataset.name, description: dataset.description };
}

const sections = [
  { id: "overview", label: "Overview" },
  { id: "data", label: "Data" },
  { id: "methodology", label: "Methodology" },
  { id: "usage", label: "Usage" },
  { id: "models", label: "Models" },
  { id: "limitations", label: "Limitations" },
  { id: "versions", label: "Versions" },
];

// Placeholder copy until each dataset's documentation is written up.
const methodology = [
  ["Collection", "How the source language data was gathered."],
  ["Processing", "How speech and related resources were prepared and structured."],
  ["Annotation", "How language and civic information were organised within the dataset."],
  ["Review", "How the resulting data was assessed and prepared for use."],
];

const limitations = [
  ["Known Limitations", "Document known gaps and constraints within the dataset."],
  ["Intended Use", "Describe the research and development contexts the dataset is designed to support."],
  ["Out-of-Scope Use", "Clarify applications or interpretations the dataset was not designed to support."],
  ["Representation", "Document relevant considerations around language and contextual coverage."],
];

const DatasetPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset) notFound();

  const models = registryModels.filter((m) => dataset.usedBy.includes(m.name));
  const languages = dataset.languages.join(", ");
  const access = accessSnippets(dataset);

  return (
    <>
      <PageHero
        ruled
        eyebrow={`Datasets / ${dataset.kind}`}
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
            <Block id="overview" eyebrow="Overview" title="The data, in context.">
              <p className="text-sm text-pretty text-faint">{dataset.description}</p>
              {models.length > 0 && (
                <p className="text-sm text-pretty text-faint">
                  CommonMind uses it to train and evaluate {models.map((m) => m.name).join(", ")}.
                </p>
              )}
              <InfoTable
                title="DATASET INFORMATION"
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

            <Block id="data" eyebrow="Data" title="Explore what's in the dataset." lede="Understand the language, content, and structure represented within the corpus.">
              <Panel className="overflow-hidden">
                <h3 className="border-b border-line px-6 py-4 font-mono text-lg sm:px-10">DATA PREVIEW</h3>
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
                  Sample rows will appear here once the preview is published.
                </p>
              </Panel>

              <div className="flex flex-col gap-6 pt-6">
                <h3 className="text-h3">What&apos;s represented.</h3>
                <p className="text-sm text-faint">
                  Understand the languages, data types, and contexts covered by this dataset.
                </p>
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
                    <span className="font-mono text-sm">Domains</span>
                    <TagChain tags={dataset.domains} />
                  </div>
                )}
              </div>
            </Block>

            <Block id="methodology" eyebrow="Methodology" title="How the dataset was built." lede="Learn how the data was collected, processed, structured, reviewed, and prepared for civic language research.">
              <ol className="flex flex-col gap-8 border-t border-line pt-10">
                {methodology.map(([step, line], i) => (
                  <li key={step} className="flex flex-col gap-2">
                    <span className="font-mono text-lg">
                      {String(i + 1).padStart(2, "0")} — {step}
                    </span>
                    <span className="text-sm text-faint">{line}</span>
                  </li>
                ))}
              </ol>
            </Block>

            <Block id="usage" eyebrow="Usage" title={`Use ${dataset.name}.`} lede="Access the dataset for research, model development, evaluation, and civic language experimentation.">
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
                    label: "Documentation",
                    content: (
                      <Panel className="flex flex-col gap-4 p-8">
                        <p className="text-sm text-faint">
                          The publisher&apos;s page documents the dataset&apos;s sources, structure and terms of use.
                        </p>
                        <ArrowLink href={dataset.href}>Read Documentation</ArrowLink>
                      </Panel>
                    ),
                  },
                ]}
              />
              <InfoTable
                title="Dataset Details"
                rows={[{ label: "Format" }, { label: "Version" }, { label: "License" }, { label: "Download Size" }]}
                footer={
                  <div className="flex flex-wrap gap-8 pt-4">
                    <ArrowLink href={dataset.href}>Download Dataset</ArrowLink>
                    <ArrowLink href={dataset.href}>Read Documentation</ArrowLink>
                  </div>
                }
              />
            </Block>

            {models.length > 0 && (
              <Block id="models" eyebrow="Connected Models" title="Models connected to this dataset." lede={`Explore models and language tools built with ${dataset.name}.`}>
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
                          View Model
                          <Arrow direction="right" className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block id="limitations" eyebrow="Limitations" title="Understand the boundaries of the data." lede="Review known limitations, representation gaps, intended uses, and areas where additional language data or research may be needed.">
              <dl className="flex flex-col gap-8 border-t border-line pt-10">
                {limitations.map(([title, line]) => (
                  <div key={title} className="flex flex-col gap-2">
                    <dt className="font-mono text-lg">{title}</dt>
                    <dd className="text-sm text-faint">{line}</dd>
                  </div>
                ))}
              </dl>
            </Block>

            <Block id="versions" eyebrow="Versions" title="Dataset history." lede="Track changes, additions, and improvements across releases.">
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
                      <td className="px-6 py-4">In use</td>
                      <td className="px-6 py-4">{dataset.used ?? "–"}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-6 pb-6 sm:px-10">
                  <ArrowLink href={dataset.href} arrow="right">
                    View Release Notes
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
