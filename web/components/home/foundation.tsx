import { Container } from "@/components/common/container";
import { ArrowLink, Eyebrow } from "@/components/system/primitives";
import { Emphasized } from "@/lib/copy/emphasized";
import type { PageCopy } from "@/lib/copy/pages";

// The statement of purpose, framed by a hairline grid with the CommonMind
// mark tucked into the corner where the lines meet.
function Foundation({ copy }: { copy: PageCopy<"home">["foundation"] }) {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line">
      <div aria-hidden className="absolute inset-y-0 right-[18%] -z-10 hidden w-px bg-line lg:block" />
      <span
        aria-hidden
        className="absolute right-[calc(18%+1rem)] bottom-5 hidden size-7.5 bg-signal mask-[url(/icon-white.svg)] mask-contain mask-center mask-no-repeat lg:block"
      />
      <Container className="flex flex-col gap-8 py-20 sm:py-24">
        <Eyebrow tone="foreground" uppercase={false}>
          {copy.eyebrow}
        </Eyebrow>
        <p className="max-w-4xl text-h2 text-pretty lg:max-w-[75%]">
          <Emphasized text={copy.statement} />
        </p>
        <ArrowLink href="/get-started" arrow="up-right" className="text-sm">
          {copy.cta}
        </ArrowLink>
      </Container>
    </section>
  );
}

export { Foundation };
