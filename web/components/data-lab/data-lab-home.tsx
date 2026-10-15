"use client";

import { SectionHeader } from "@/components/system/primitives";
import type { PageCopy } from "@/lib/copy/pages";

import { LanguageBoard } from "./language-board";
import { useProgress } from "./use-progress";

/** The public Data Lab page's body: live progress in every language. */
function DataLabHome({ copy }: { copy: PageCopy<"dataLab">["progress"] }) {
  const { board, error } = useProgress();

  return (
    <section className="flex flex-col gap-8">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
        layout="split"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {board && <LanguageBoard languages={board.languages} progress={board.progress} />}
    </section>
  );
}

export { DataLabHome };
