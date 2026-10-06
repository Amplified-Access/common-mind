import Image from "next/image";

import { Container } from "@/components/common/container";
import { Backdrop } from "@/components/system/backdrop";
import { Eyebrow } from "@/components/system/primitives";
import { TagChain } from "@/components/system/tag-chain";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  tags?: string[];
  /** The yellow CommonMind tile on a grid of nodes, above the eyebrow. */
  tile?: boolean;
  /** Centered (default) or left-aligned with the lede beside the title. */
  align?: "center" | "split";
  /** Controls under the heading: search, filters. */
  children?: React.ReactNode;
  /** Full-width content after the heading block, still on the hero's wash. */
  after?: React.ReactNode;
  /** A hairline closes the hero, for pages with tabs or a side rail below. */
  ruled?: boolean;
  className?: string;
};

function PageHero({
  eyebrow,
  title,
  lede,
  tags,
  tile,
  align = "center",
  children,
  after,
  ruled,
  className,
}: PageHeroProps) {
  const centered = align === "center";
  return (
    <section
      className={cn(
        "zoom-viewport relative isolate overflow-hidden",
        ruled && "border-b border-line",
        className,
      )}
    >
      <Backdrop wash grain grid stars />
      <Container
        className={cn(
          "flex flex-col gap-6 pt-16 pb-14 sm:pt-20 sm:pb-16",
          centered ? "items-center text-center" : "items-start",
          tile && "pt-10 sm:pt-12",
        )}
      >
        {tile && <NodeTile />}
        {centered ? (
          <div className="flex max-w-2xl flex-col items-center gap-5">
            {eyebrow && <Eyebrow className="text-sm">{eyebrow}</Eyebrow>}
            <h1 className="text-h2 text-balance">{title}</h1>
            {lede && <p className="max-w-lg text-sm text-pretty text-subtle">{lede}</p>}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-5">
            {eyebrow && <Eyebrow className="text-base">{eyebrow}</Eyebrow>}
            <div className="grid w-full gap-5 md:grid-cols-[minmax(0,26rem)_minmax(0,22rem)] md:gap-6">
              <h1 className="text-h2 text-balance">{title}</h1>
              {lede && <p className="text-sm text-pretty text-subtle md:pt-2">{lede}</p>}
            </div>
          </div>
        )}
        {tags && tags.length > 0 && (
          <TagChain tags={tags} className={cn(centered && "justify-center")} />
        )}
        {children && (
          <div className={cn("flex w-full flex-col gap-6 pt-4", centered && "items-center")}>
            {children}
          </div>
        )}
      </Container>
      {after}
    </section>
  );
}

// The CommonMind mark on a yellow tile, at the center of a faint grid with a
// few lit nodes: the model at the center of the infrastructure.
function NodeTile() {
  const lines = [0, 64, 128, 192, 256, 320];
  const dots: [number, number][] = [
    [160, 30],
    [96, 96],
    [224, 96],
    [160, 158],
    [24, 124],
    [288, 180],
  ];
  return (
    <div aria-hidden className="relative h-48 w-80">
      <svg
        viewBox="0 0 320 192"
        className="absolute inset-0 size-full mask-[radial-gradient(closest-side,#000_45%,transparent_100%)]"
      >
        {lines.map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1={0} y2={192} stroke="white" strokeOpacity={0.14} />
        ))}
        {[0, 64, 128, 192].map((y) => (
          <line key={`h${y}`} x1={0} x2={320} y1={y} y2={y} stroke="white" strokeOpacity={0.14} />
        ))}
        {dots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill="white" />
        ))}
      </svg>
      <div className="absolute top-1/2 left-1/2 flex size-15 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-signal shadow-[0_0_40px_rgb(255_211_0/0.25)]">
        <Image src="/icon-black.svg" alt="" width={458} height={480} className="h-8 w-auto" />
      </div>
    </div>
  );
}

export { NodeTile, PageHero };
