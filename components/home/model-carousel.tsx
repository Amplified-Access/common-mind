import Link from "next/link";

import { Container } from "@/components/common/container";
import { servedLanguages, taskLabel } from "@/components/models/catalog";
import { registryModels } from "@/components/models/registry";
import { ArrowLink, SectionHeader } from "@/components/system/primitives";

// The models as a row of windows, each showing the start of its own usage
// code. The row scrolls sideways and fades out at both edges.
function ModelCarousel() {
  return (
    <section className="zoom-viewport relative py-20 sm:py-28">
      <Container className="flex flex-col gap-16">
        <SectionHeader
          size="h1"
          layout="split"
          title="Open models for civic language understanding."
          lede="Explore, evaluate, and use models built for transcription, translation, civic terminology, and issue classification."
          action={<ArrowLink href="/models">Explore Models</ArrowLink>}
        />
      </Container>
      <div className="scrollbar-none mt-16 snap-x snap-mandatory overflow-x-auto mask-[linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="flex w-max gap-6 px-[12%]">
          {registryModels.map((model) => (
            <li key={model.slug} className="snap-center">
              <Link
                href={`/models/${model.slug}`}
                className="group relative flex h-96 w-[min(80vw,30rem)] flex-col gap-6 overflow-hidden rounded-lg border border-line bg-[#0b0a07] p-8 transition-colors hover:border-signal/60"
              >
                <span aria-hidden className="absolute top-5 right-6 flex items-center gap-5 text-faint">
                  <span className="h-px w-3 bg-current" />
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor">
                    <path d="M7 1h4v4M5 11H1V7M11 1 7 5M1 11l4-4" />
                  </svg>
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor">
                    <path d="m1 1 10 10M11 1 1 11" />
                  </svg>
                </span>
                <span className="pr-20 text-[1.75rem] leading-tight tracking-[-0.01em] transition-colors group-hover:text-signal">
                  {model.name}
                </span>
                <span className="font-mono text-xs text-signal">{servedLanguages(model).join(" · ")}</span>
                <span className="self-start border-b border-foreground pb-1.5 font-mono text-xs">
                  {taskLabel(model.task)}
                </span>
                <pre
                  aria-hidden
                  className="mt-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/50 mask-[linear-gradient(to_bottom,#000_30%,transparent)]"
                >
                  {model.usage.code.split("\n").slice(0, 14).join("\n")}
                </pre>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export { ModelCarousel };
