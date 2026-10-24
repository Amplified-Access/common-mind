import { Container } from "@/components/common/container";
import { Backdrop } from "@/components/system/backdrop";
import { Eyebrow } from "@/components/system/primitives";

export type HeroWindow = {
  name: string;
  language: string;
  tab: string;
  code: string;
};

type ModelsHeroProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  /** Every released model, drawn as tilted, dimmed windows drifting behind the heading. */
  windows: HeroWindow[];
};

// The models page's hero: the heading left-aligned over a row of model
// windows that recede to the upper right and drift past in an endless
// marquee, each showing a model's name, language and the code to run it.
function ModelsHero({ eyebrow, title, lede, windows }: ModelsHeroProps) {
  return (
    <section className="zoom-viewport relative isolate overflow-hidden border-b border-line pt-(--header-height)">
      <Backdrop grain />
      <WindowRow windows={windows} />
      <Container className="flex flex-col items-start gap-6 pt-32 pb-16 sm:pt-44 sm:pb-18 md:px-16 xl:px-26">
        {eyebrow && <Eyebrow className="text-base">{eyebrow}</Eyebrow>}
        <h1 className="max-w-2xl text-h2 text-balance">{title}</h1>
        {lede && <p className="max-w-md text-sm text-pretty text-subtle">{lede}</p>}
      </Container>
    </section>
  );
}

// How long one window takes to drift its own width across the hero.
const SECONDS_PER_WINDOW = 18;

function WindowRow({ windows }: { windows: HeroWindow[] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden mask-[linear-gradient(to_bottom,#000_55%,transparent)] perspective-[1200px] perspective-origin-[40%_20%] select-none"
    >
      <div className="absolute top-56 left-[-10rem] origin-top-left opacity-30 blur-[1px] transform-[rotateX(40deg)_rotateY(8deg)_rotateZ(-15deg)]">
        {/* Two copies of the windows drift left by one copy, then start
            over, along the tilted plane. Each window carries its own
            trailing space so the copies are exactly half the track. */}
        <div
          className="flex w-max animate-[cm-marquee_var(--marquee-duration)_linear_infinite] motion-reduce:animate-none"
          style={{ "--marquee-duration": `${windows.length * SECONDS_PER_WINDOW}s` } as React.CSSProperties}
        >
          {[...windows, ...windows].map((w, i) => (
            <ModelWindow key={`${w.name}-${i}`} window={w} />
          ))}
        </div>
      </div>
      {/* Darkest behind the heading so it reads over the windows. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_20%_65%,rgb(0_0_0/0.75),transparent_75%)]" />
    </div>
  );
}

function ModelWindow({ window: w }: { window: HeroWindow }) {
  return (
    <div className="mr-5 flex h-[30rem] w-[38rem] shrink-0 flex-col gap-4 rounded-md border border-line-strong bg-[#0d0c0a] px-9 py-7">
      <div className="flex justify-end gap-6 font-mono text-lg text-faint">
        <span>–</span>
        <span>⤢</span>
        <span>✕</span>
      </div>
      <p className="text-3xl leading-normal whitespace-nowrap">{w.name}</p>
      <p className="font-mono text-sm text-signal">{w.language}</p>
      <p className="w-fit border-b-2 border-foreground/70 pb-2 font-mono text-sm">{w.tab}</p>
      <pre className="overflow-hidden font-mono text-[13px] leading-relaxed text-subtle">{w.code}</pre>
    </div>
  );
}

export { ModelsHero };
