import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { formatDate, getModel, registryModels } from "@/components/models/registry";
import { Translator } from "@/components/playground/translator";
import { Code } from "@/components/system/code";
import {
  ArrowLink,
  MetaGrid,
  Section,
  SectionHeader,
} from "@/components/system/primitives";

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
  return { title: model.name, description: model.tagline };
}

const ModelPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  const evaluation = model.evaluation;
  const hf = model.availability.find((a) => a.label === "Hugging Face");

  return (
    <>
      <section>
        <Container className="flex flex-col gap-20 pt-20 pb-8 sm:pt-28">
          <div className="flex flex-col gap-8">
            <Link
              href="/models#registry"
              className="text-sm text-faint transition-colors hover:text-foreground"
            >
              ← Models
            </Link>
            <h1 className="text-h1 wrap-break-word">{model.name}</h1>
            <p className="max-w-2xl text-lg text-pretty text-subtle sm:text-xl">
              {model.tagline}.
            </p>
            {hf?.href && <ArrowLink href={hf.href}>Hugging Face</ArrowLink>}
          </div>
          <MetaGrid
            items={[
              { label: "Base", value: model.base.id.split("/")[1], href: model.base.href },
              { label: "Parameters", value: `${model.base.params} · ${model.trainable} trained` },
              { label: "Method", value: model.approach.split(" · ")[0] },
              { label: "Direction", value: model.directions.join(", ") },
              { label: "License", value: model.license.split(" · ")[0] },
              { label: "Released", value: formatDate(model.release) },
            ]}
          />
        </Container>
      </section>

      <Section id="evaluation">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Evaluation." lede={evaluation.set} />
          <div className="grid gap-16 sm:grid-cols-2">
            {(
              [
                ["BLEU", evaluation.bleu, evaluation.baseBleu],
                ["chrF++", evaluation.chrf, evaluation.baseChrf],
              ] as const
            ).map(([label, after, before]) => (
              <div key={label} className="flex flex-col gap-3">
                <span className="text-7xl font-medium tracking-tight tabular-nums">
                  {after.toFixed(2)}
                </span>
                <span className="text-subtle">
                  {label}
                  {before !== undefined && (
                    <span className="text-faint"> · base model {before.toFixed(2)}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {evaluation.flores && (
            <ArrowLink href="/benchmarks#results" className="text-subtle">
              Compare with other models
            </ArrowLink>
          )}
        </Container>
      </Section>

      <Section id="usage">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            title="Use it."
            action={
              <ArrowLink href={`/research/${model.researchSlug}`} className="text-subtle">
                How it was built
              </ArrowLink>
            }
          />
          <Code code={model.usage.code} language={model.usage.language} title="inference.py" />
        </Container>
      </Section>

      <Section id="try">
        <Container className="flex flex-col gap-16">
          <SectionHeader title="Try it." />
          <Translator initialModel={model.slug} />
        </Container>
      </Section>
    </>
  );
};

export default ModelPage;
