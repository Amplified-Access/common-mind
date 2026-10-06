import Image from "next/image";
import Link from "next/link";

import { Arrow } from "@/components/system/arrow";
import { TagChain } from "@/components/system/tag-chain";
import { cn } from "@/lib/utils";

export type ModelCardData = {
  slug: string;
  name: string;
  fields: { label: string; value: string }[];
  tags: string[];
};

// A registry entry: name and mark, a grid of facts, and the tag chain. The
// whole card is the link; it turns yellow under the pointer.
function ModelCard({ model, className }: { model: ModelCardData; className?: string }) {
  return (
    <Link
      href={`/models/${model.slug}`}
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-300 hover:border-signal hover:bg-signal",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid mask-[linear-gradient(to_left,#000_0%,transparent_70%)] transition-opacity group-hover:opacity-40"
      />
      <div className="flex items-center justify-between gap-6 border-b border-line px-6 py-5 transition-colors group-hover:border-background/80 sm:px-8">
        <h3 className="text-[1.5rem] leading-tight tracking-[-0.01em] text-foreground transition-colors group-hover:text-background sm:text-[1.75rem]">
          {model.name}
        </h3>
        <span className="relative size-8 shrink-0">
          <Image
            src="/icon-white.svg"
            alt=""
            fill
            sizes="32px"
            className="object-contain transition-opacity group-hover:opacity-0"
          />
          <Image
            src="/icon-black.svg"
            alt=""
            fill
            sizes="32px"
            className="object-contain opacity-0 transition-opacity group-hover:opacity-100"
          />
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-6 pt-6 font-mono text-[13px] sm:grid-cols-[auto_auto] sm:justify-start sm:px-8">
        {model.fields.map((field) => (
          <div key={field.label} className="flex gap-2">
            <dt className="text-foreground transition-colors group-hover:text-background">
              {field.label}:
            </dt>
            <dd className="text-faint transition-colors group-hover:text-background/80">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 px-6 pt-7 pb-6 sm:px-8">
        <TagChain tags={model.tags} />
        <span className="inline-flex items-center gap-2 font-mono text-xs text-signal transition-colors group-hover:text-background">
          View Model
          <Arrow />
        </span>
      </div>
    </Link>
  );
}

export { ModelCard };
