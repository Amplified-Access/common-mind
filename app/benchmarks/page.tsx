import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { BenchmarkSection } from "@/components/benchmarks/benchmark-section";
import { benchmarks } from "@/components/benchmarks/data";

export const metadata: Metadata = {
  title: "Benchmarks · CommonMind",
  description:
    "See how CommonMind models perform, how they compare with base models, and where they still need to improve.",
};

const BenchmarksPage = () => {
  return (
    <>
      <ImageHero
        title="Benchmarks"
        tagline="Measure what improves."
        imageSrc="/flat-lay-statistics-presentation-with-chart.jpg"
      />
      <section
        id="comparison"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Benchmark comparison
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Every model below was scored on the same FLORES-200 devtest split,
            so BLEU and chrF++ are directly comparable within each language.
          </p>
          <div className="mt-8 flex flex-col gap-8">
            {benchmarks.map((benchmark) => (
              <BenchmarkSection key={benchmark.code} benchmark={benchmark} />
            ))}
          </div>
        </Container>
      </section>
      <section
        id="methodology"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Benchmark methodology
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-8">
              <h3 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
                What we measure
              </h3>
              <p className="mt-3 text-black/80">
                <strong className="text-black">BLEU</strong> scores n-gram
                overlap against a reference translation — the standard metric
                for machine translation quality, though it can be harsh on
                morphologically rich languages like Luganda, where a correct
                translation may not share many exact word forms with the
                reference.
              </p>
              <p className="mt-3 text-black/80">
                <strong className="text-black">chrF++</strong> scores
                character- and word-n-gram overlap instead, which is more
                forgiving of the spelling and morphology differences common
                in Bantu languages, and generally tracks human judgment more
                closely for this kind of low-resource pair.
              </p>
              <p className="mt-3 text-black/80">
                All scores above are English→target-language, evaluated on{" "}
                <a
                  href="https://huggingface.co/datasets/openlanguagedata/flores_plus"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  FLORES-200 devtest
                </a>{" "}
                (1,012 sentence pairs) — the shared benchmark used by every
                entry in the charts.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-8">
              <h3 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
                Sourcing
              </h3>
              <p className="mt-3 text-black/80">
                Our own models&apos; scores come from our own FLORES-200 eval
                runs, documented on each{" "}
                <a
                  href="/models"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  model card
                </a>
                . Gemma 3 4B/27B, GPT-5 Mini, and Gemini 2.0 Flash figures are
                not ours — they&apos;re published by{" "}
                <a
                  href="https://huggingface.co/CraneAILabs"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Crane AI Labs
                </a>{" "}
                on the model cards for{" "}
                <a
                  href="https://huggingface.co/CraneAILabs/ganda-gemma-1b"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Ganda-gemma-1b
                </a>{" "}
                and{" "}
                <a
                  href="https://huggingface.co/CraneAILabs/swahili-gemma-1b"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  swahili-gemma-1b
                </a>
                , not independently re-run by us — click through to the
                Source column in either table above to verify any number.
              </p>
              <p className="mt-3 text-black/80">
                <strong className="text-black">Not pictured:</strong>{" "}
                <a
                  href="https://huggingface.co/Sunbird/translate-nllb-1.3b-salt"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Sunbird&apos;s translate-nllb-1.3b-salt
                </a>{" "}
                covers English→Luganda too (30.4 BLEU) but is evaluated on
                its own SALT-dev split rather than FLORES-200, so it isn&apos;t
                a fair head-to-head number against the models charted here.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default BenchmarksPage;
