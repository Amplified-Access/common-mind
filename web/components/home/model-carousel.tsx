import Link from "next/link";

import { Container } from "@/components/common/container";
import { servedLanguages, taskLabel } from "@/components/models/catalog";
import { highlightCode } from "@/components/models/highlight";
import { registryModels } from "@/components/models/registry";
import { ArrowLink, SectionHeader } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

// Seconds each card takes to drift one card-width, slow enough to read.
const SECONDS_PER_CARD = 12;
const CODE_LINES = 14;

// The models as a row of windows, each showing the start of its own usage
// code and fading out toward its foot, which sits right on the next section. The row drifts right to left on a loop, fading out at both edges,
// and holds still under the pointer or keyboard focus. With reduced motion
// it's a row to swipe through instead.
async function ModelCarousel() {
  const cards = await Promise.all(
    registryModels.map(async (model) => ({
      model,
      code: await highlightCode(model.usage.code.split("\n").slice(0, CODE_LINES).join("\n"), model.usage.language),
    })),
  );

  // Two copies back to back: the loop slides exactly one copy over.
  const loop = [...cards.map((c) => ({ ...c, copy: false })), ...cards.map((c) => ({ ...c, copy: true }))];

  return (
    <section className="zoom-viewport relative pt-[calc(var(--section-pad)*2)]">
      <Container className="flex flex-col gap-16">
        <SectionHeader
          size="h1"
          layout="split"
          title="Open models for multilingual civic AI"
          lede="Explore, evaluate, and build with open models for transcription, translation, civic discourse analysis, and issue classification."
          action={<ArrowLink href="/models">Explore Models</ArrowLink>}
        />
      </Container>
      <div className="scrollbar-none mt-16 overflow-hidden mask-[linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] motion-reduce:overflow-x-auto">
        <ul
          className="flex w-max animate-[cm-marquee_var(--marquee-duration)_linear_infinite] hover:[animation-play-state:paused] has-focus-visible:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:px-[12%]"
          style={{ "--marquee-duration": `${cards.length * SECONDS_PER_CARD}s` } as React.CSSProperties}
        >
          {loop.map(({ model, code, copy }) => (
            <li
              key={`${model.slug}${copy ? "-copy" : ""}`}
              aria-hidden={copy || undefined}
              inert={copy}
              className={cn("pr-4.5", copy && "motion-reduce:hidden")}
            >
              <Link
                href={`/models/${model.slug}`}
                className="group relative flex h-[30rem] w-[min(80vw,30rem)] flex-col gap-6 overflow-hidden rounded-card border border-line bg-[#0b0a07] p-8 mask-[linear-gradient(to_bottom,#000_55%,transparent)] transition-colors hover:border-signal/60"
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
                <div
                  aria-hidden
                  className="mt-2 text-xs leading-relaxed opacity-80 mask-[linear-gradient(to_bottom,#000_35%,transparent)] [&_code]:font-mono [&_pre]:whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: code }}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export { ModelCarousel };
