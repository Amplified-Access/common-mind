import { AiChipIcon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { servedLanguages, taskLabel } from "@/components/models/catalog";
import { formatDate, getModel, registryModels } from "@/components/models/registry";
import { usagePaths } from "@/components/models/usage";
import { Translator } from "@/components/playground/translator";
import { Code } from "@/components/system/code";
import { CodeTabs } from "@/components/system/code-tabs";
import { InfoTable } from "@/components/system/info-table";
import { PageHero } from "@/components/system/page-hero";
import { PageTabs } from "@/components/system/page-tabs";
import { ArrowLink, Eyebrow, Panel, Section, StatusDot } from "@/components/system/primitives";
import { copyFor, getContent } from "@/lib/content";
import { getPageCopy } from "@/lib/copy";
import { fill } from "@/lib/copy/fill";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return registryModels.map((model) => ({ slug: model.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) return {};
  const { tagline } = copyFor(await getContent(), slug);
  return { title: model.name, description: tagline };
}

const ModelPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  const [content, text] = await Promise.all([getContent(), getPageCopy("modelDetail")]);
  const copy = copyFor(content, model.slug);
  const languages = servedLanguages(model);
  const evaluation = model.evaluation;
  const hf = model.availability.find((a) => a.label === "Hugging Face");
  const trainedOn = content.datasets.filter((d) => d.usedBy.includes(model.name));
  // "English to Swahili" for one direction, "English and Luganda" for both.
  const pair = `English ${model.directions.length > 1 ? "and" : "to"} ${languages.join(", ")}`;

  const overview = (
    <TabBody>
      <div className="flex flex-col gap-5">
        <Eyebrow uppercase={false}>{text.overview.eyebrow}</Eyebrow>
        <h2 className="text-h2 text-balance">{fill(text.overview.title, { pair })}</h2>
        <p className="text-sm text-pretty text-faint">{copy.overview}</p>
        <ul className="flex flex-col gap-2 pt-2 text-sm text-subtle">
          {copy.capabilities.map((capability) => (
            <li key={capability} className="flex gap-3">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-signal" />
              {capability}
            </li>
          ))}
        </ul>
        {hf?.href && (
          <ArrowLink href={hf.href} className="pt-3">
            {text.overview.hfLink}
          </ArrowLink>
        )}
      </div>
      <InfoTable
        title={text.overview.tableTitle}
        ruled
        rows={[
          { label: "Language", value: languages.join(", ") },
          { label: "Task", value: taskLabel(model.task) },
          { label: "Parameters", value: `${model.base.params} · ${model.trainable} trained` },
          { label: "Method", value: model.approach },
          { label: "Direction", value: model.directions.join(", ") },
          { label: "License", value: model.license },
          { label: "Released", value: formatDate(model.release) },
          {
            label: "Base Model",
            value: (
              <a href={model.base.href} target="_blank" rel="noreferrer" className="hover:text-signal">
                {model.base.id} ↗
              </a>
            ),
          },
          {
            label: "Available on",
            value: model.availability.map((a) => a.label).join(", "),
          },
        ]}
      />
    </TabBody>
  );

  const benchmarks = (
    <TabBody>
      <div className="flex flex-col gap-5">
        <Eyebrow uppercase={false}>{text.benchmarks.eyebrow}</Eyebrow>
        <h2 className="text-h2 text-balance">{text.benchmarks.title}</h2>
        <p className="text-sm text-pretty text-faint">{evaluation.summary}</p>
        <div className="flex flex-col gap-3 pt-3">
          <ArrowLink href="/benchmarks#methodology">{text.benchmarks.methodologyLink}</ArrowLink>
          {evaluation.flores && (
            <ArrowLink href="/benchmarks#results">{text.benchmarks.compareLink}</ArrowLink>
          )}
        </div>
      </div>
      <Panel className="overflow-hidden">
        <h3 className="border-b border-line px-6 py-4 font-mono text-lg sm:px-10">{text.benchmarks.panelTitle}</h3>
        <ul className="flex flex-col gap-4 px-6 py-7 sm:px-10">
          {[
            { label: "BLEU", value: evaluation.bleu, ours: true },
            { label: "BLEU · base", value: evaluation.baseBleu, ours: false },
            { label: "chrF++", value: evaluation.chrf, ours: true },
            { label: "chrF++ · base", value: evaluation.baseChrf, ours: false },
          ]
            .filter((row): row is { label: string; value: number; ours: boolean } => row.value !== undefined)
            .map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)_3rem] items-center gap-4 font-mono text-[13px]"
              >
                <span className={row.ours ? "text-foreground" : "text-faint"}>{row.label}</span>
                <span className="relative h-2.5 overflow-hidden rounded-full bg-track">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${row.ours ? "bg-signal" : "bg-other"}`}
                    style={{ width: `${row.value}%` }}
                  />
                </span>
                <span className="text-right text-faint tabular-nums">{row.value.toFixed(2)}</span>
              </li>
            ))}
        </ul>
        <p className="px-6 pb-6 font-mono text-xs text-faint sm:px-10">
          {fill(text.benchmarks.scale, { set: evaluation.short })}
        </p>
      </Panel>
    </TabBody>
  );

  const training = (
    <TabBody>
      <div className="flex flex-col gap-6">
        <h2 className="text-h2 text-balance">{text.training.title}</h2>
        <div className="flex flex-col gap-4">
          {trainedOn[0] && (
            <ArrowLink href={`/datasets/${trainedOn[0].slug}`}>{text.training.datasetLink}</ArrowLink>
          )}
          <ArrowLink href={`/research/${model.researchSlug}`}>{text.training.notesLink}</ArrowLink>
          <ArrowLink href="/research">{text.training.researchLink}</ArrowLink>
        </div>
      </div>
      <InfoTable
        rows={[
          { label: "Base model", value: model.base.id },
          { label: "Training approach", value: model.approach },
          { label: "Trainable parameters", value: model.trainable },
          {
            label: "Training data",
            value: trainedOn.filter((d) => d.kind !== "Evaluation").map((d) => d.name).join(", "),
          },
          { label: "Released artifact", value: model.artifact },
          { label: "Max length", value: model.maxLength },
          { label: "Dataset version" },
          { label: "Evaluation dataset", value: evaluation.set },
        ]}
      />
    </TabBody>
  );

  const usage = (
    <TabBody stacked>
      <div className="grid gap-5 md:grid-cols-[minmax(0,22rem)_minmax(0,20rem)] md:gap-16">
        <h2 className="text-h2 text-balance">{fill(text.usage.title, { name: model.name })}</h2>
        <p className="text-sm text-pretty text-faint md:pt-2">{text.usage.lede}</p>
      </div>
      <CodeTabs
        tabs={usagePaths(model, copy.usage).map((path) => ({
          id: path.id,
          label: path.label,
          content: <Code code={path.code} language={path.language} title={path.title} />,
        }))}
      />
    </TabBody>
  );

  const versions = (
    <TabBody stacked>
      <h2 className="text-h2">{text.versions.title}</h2>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-xl font-mono text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Version", "Released", "Status", "Changes", ""].map((h) => (
                <th key={h} className="px-8 py-6 font-normal uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-8 py-6 text-faint">V1.0</td>
              <td className="px-8 py-6 text-faint uppercase">{formatDate(model.release)}</td>
              <td className="px-8 py-6">
                <StatusDot label={text.versions.current} />
              </td>
              <td className="px-8 py-6 text-faint">{text.versions.initialRelease}</td>
              <td className="px-8 py-6 text-right">
                {hf?.href && <ArrowLink href={hf.href}>{text.versions.view}</ArrowLink>}
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </TabBody>
  );

  return (
    <>
      <PageHero
        tile={AiChipIcon}
        eyebrow={text.hero.eyebrow}
        title={model.name}
        lede={copy.tagline && `${copy.tagline}.`}
        tags={[...languages, taskLabel(model.task), "Open Model"]}
      />

      <PageTabs
        tabs={[
          { id: "overview", label: text.tabs.overview, content: overview },
          { id: "benchmarks", label: text.tabs.benchmarks, content: benchmarks },
          { id: "training", label: text.tabs.training, content: training },
          { id: "usage", label: text.tabs.usage, content: usage },
          { id: "versions", label: text.tabs.versions, content: versions },
        ]}
      />

      <Section id="try" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>{text.playground.eyebrow}</Eyebrow>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-12">
              <h2 className="text-h2">{text.playground.title}</h2>
              <p className="max-w-xs text-sm text-foreground/85">
                {fill(
                  model.directions.length > 1 ? text.playground.ledeBothWays : text.playground.ledeOneWay,
                  { languages: languages.join(", ") },
                )}
              </p>
            </div>
          </div>
          <Translator initialModel={model.slug} locked />
        </Container>
      </Section>
    </>
  );
};

// A tab's body: copy beside a card by default, or stacked full width. The
// sides carry the faint grid from the design.
function TabBody({ children, stacked }: { children: React.ReactNode; stacked?: boolean }) {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden py-16 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid bg-grid-wide mask-[linear-gradient(to_right,#000_0%,transparent_22%,transparent_78%,#000_100%)] opacity-70"
      />
      <Container
        size="default"
        className={
          stacked
            ? "flex flex-col gap-10"
            : "grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20"
        }
      >
        {children}
      </Container>
    </section>
  );
}

export default ModelPage;
