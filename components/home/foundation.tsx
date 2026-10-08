import { Container } from "@/components/common/container";
import { ArrowLink, Eyebrow } from "@/components/system/primitives";

// The statement of purpose, framed by a hairline grid with the CommonMind
// mark tucked into the corner where the lines meet.
function Foundation() {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line">
      <div aria-hidden className="absolute inset-y-0 right-[18%] -z-10 hidden w-px bg-line lg:block" />
      <span
        aria-hidden
        className="absolute right-[calc(18%+1rem)] bottom-5 hidden size-7.5 bg-signal mask-[url(/icon-white.svg)] mask-contain mask-center mask-no-repeat lg:block"
      />
      <Container className="flex flex-col gap-8 py-20 sm:py-24">
        <Eyebrow tone="foreground" uppercase={false}>
          The Foundation
        </Eyebrow>
        <p className="max-w-4xl text-h2 text-pretty lg:max-w-[75%]">
          <span className="text-signal">Building open AI infrastructure</span> that connects
          language data, models, benchmarks, and research to help AI better understand civic
          speech across communities.
        </p>
        <ArrowLink href="#platform" arrow="up-right" className="text-sm">
          See What We&apos;re Building
        </ArrowLink>
      </Container>
    </section>
  );
}

export { Foundation };
