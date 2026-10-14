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
  /** Split layout only: content under the title, in the left column. */
  beneathTitle?: React.ReactNode;
  /** Split layout only: content under the lede, in the right column. */
  beneathLede?: React.ReactNode;
  /** A hairline closes the hero, for pages with tabs or a side rail below. */
  ruled?: boolean;
  /** Faint grids at either edge of the hero. */
  sideGrids?: boolean;
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
  beneathTitle,
  beneathLede,
  ruled,
  sideGrids,
  className,
}: PageHeroProps) {
  const centered = align === "center";
  return (
    <section
      className={cn(
        "zoom-viewport relative isolate overflow-hidden pt-(--header-height)",
        ruled && "border-b border-line",
        className,
      )}
    >
      <Backdrop wash grain stars shade sideGrids={sideGrids} />
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
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 className="text-h2 text-balance">{title}</h1>
            {lede && <p className="max-w-lg text-[13px] leading-[1.2] text-pretty text-faint">{lede}</p>}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-5">
            {eyebrow && <Eyebrow className="text-base">{eyebrow}</Eyebrow>}
            <div className="grid w-full gap-5 md:grid-cols-[minmax(0,26rem)_minmax(0,22rem)] md:gap-6">
              <div className="flex flex-col items-start gap-6">
                <h1 className="text-h2 text-balance">{title}</h1>
                {beneathTitle}
              </div>
              {(lede || beneathLede) && (
                <div className="flex flex-col items-start gap-5 md:pt-2">
                  {lede && <p className="text-sm text-pretty text-subtle">{lede}</p>}
                  {beneathLede}
                </div>
              )}
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

// The CommonMind mark on a yellow tile, at the center of a fine grid that
// fades out around it, with a few lit nodes on its intersections: the model
// at the center of the infrastructure. Measured from the 2026-10 mocks.
const COL = 31.25;
const ROW = 27.5;
const GRID_W = 12 * COL;
const GRID_H = 8 * ROW;
// Nodes as [column, row] steps from the tile's center.
const NODES: [number, number][] = [
  [0, -2],
  [-2, 0],
  [2, 0],
  [0, 2],
  [-5, 1],
  [4, 3],
];

function NodeTile() {
  const viewBox = `${-GRID_W / 2} ${-GRID_H / 2} ${GRID_W} ${GRID_H}`;
  const svgClass = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible";
  return (
    <div aria-hidden className="relative h-34 w-80">
      <svg
        viewBox={viewBox}
        width={GRID_W}
        height={GRID_H}
        shapeRendering="crispEdges"
        // Strongest at the tile, gone ~5 columns and ~3.5 rows out.
        className={cn(
          svgClass,
          "mask-[radial-gradient(170px_95px_at_50%_50%,#000,rgb(0_0_0/0.55)_45%,rgb(0_0_0/0.2)_75%,transparent)]",
        )}
      >
        {Array.from({ length: 13 }, (_, i) => (i - 6) * COL).map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1={-GRID_H / 2} y2={GRID_H / 2} stroke="white" strokeOpacity={0.4} style={{ strokeWidth: "var(--hairline)" }} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (i - 4) * ROW).map((y) => (
          <line key={`h${y}`} x1={-GRID_W / 2} x2={GRID_W / 2} y1={y} y2={y} stroke="white" strokeOpacity={0.4} style={{ strokeWidth: "var(--hairline)" }} />
        ))}
      </svg>
      <svg viewBox={viewBox} width={GRID_W} height={GRID_H} className={svgClass}>
        {NODES.map(([c, r]) => (
          <circle key={`${c}-${r}`} cx={c * COL} cy={r * ROW} r={2.5} fill="white" />
        ))}
      </svg>
      <div className="absolute top-1/2 left-1/2 flex size-15 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-signal">
        <Image src="/icon-black.svg" alt="" width={458} height={480} className="h-8 w-auto" />
      </div>
    </div>
  );
}

export { NodeTile, PageHero };
