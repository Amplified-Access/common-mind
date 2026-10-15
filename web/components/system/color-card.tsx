import Image from "next/image";
import Link from "next/link";

import { Arrow } from "@/components/system/arrow";
import { isExternalHref } from "@/components/system/primitives";
import { TagChain } from "@/components/system/tag-chain";
import { cn } from "@/lib/utils";

export type CardColor = "sky" | "signal" | "lilac";

const colors: Record<CardColor, string> = {
  sky: "bg-sky",
  signal: "bg-signal",
  lilac: "bg-lilac",
};

// Research and dataset cards cycle through the three card colors.
export const cardColor = (index: number): CardColor =>
  (["sky", "signal", "lilac"] as const)[index % 3];

type ColorCardProps = {
  href: string;
  title: string;
  kind: string;
  description: string;
  tags?: string[];
  cta: string;
  color: CardColor;
  className?: string;
};

// A solid colored card with a large CommonMind mark as watermark, centered
// on its right edge so half of it shows.
function ColorCard({ href, title, kind, description, tags, cta, color, className }: ColorCardProps) {
  const external = isExternalHref(href);
  const body = (
    <>
      <Image
        src="/icon-black.svg"
        alt=""
        width={52}
        height={44}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 h-52 w-auto translate-x-1/2 -translate-y-1/2 opacity-[0.07] transition-transform duration-500 group-hover:-rotate-12"
      />
      <div className="relative flex flex-col gap-3">
        {/* Two lines at most, so long titles don't stretch the row. */}
        <h3 title={title} className="line-clamp-2 text-[1.375rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
          {title}
        </h3>
        <span className="text-[13px]">{kind}</span>
        <p className="line-clamp-3 max-w-56 font-mono text-[13px] leading-snug">{description}</p>
      </div>
      <div className="relative mt-auto flex flex-col gap-4 pt-12">
        {tags && tags.length > 0 && <TagChain tags={tags} tone="ink" size="sm" uppercase />}
        <span className="inline-flex items-center gap-2 font-mono text-[11px]">
          {cta}
          <Arrow className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </>
  );
  const classes = cn(
    "group relative isolate flex min-h-60 flex-col overflow-hidden rounded-card p-5 text-background",
    colors[color],
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}

export { ColorCard };
