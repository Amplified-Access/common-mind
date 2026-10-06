import { Container } from "@/components/common/container";
import { ArrowLink, Eyebrow } from "@/components/system/primitives";

// The statement of purpose, framed by a hairline grid that meets at the
// CommonMind mark.
function Foundation() {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line">
      <div aria-hidden className="absolute inset-y-0 right-[18%] -z-10 hidden w-px bg-line lg:block" />
      <span
        aria-hidden
        className="absolute right-[18%] bottom-0 hidden size-8 translate-x-1/2 translate-y-1/2 bg-signal mask-[url(/icon-white.svg)] mask-contain mask-center mask-no-repeat lg:block"
      />
      <Container className="flex flex-col gap-8 py-24 sm:py-32">
        <Eyebrow tone="foreground" uppercase={false} className="text-sm">
          The Foundation
        </Eyebrow>
        <p className="max-w-4xl text-h1 text-pretty lg:max-w-[75%]">
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
