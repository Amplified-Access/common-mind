"use client";

import { SectionHeader } from "@/components/system/primitives";

import { LanguageBoard } from "./language-board";
import { useProgress } from "./use-progress";

/** The public Data Lab page's body: live progress in every language. */
function DataLabHome() {
  const { board, error } = useProgress();

  return (
    <section className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Languages"
        title="Progress in every language"
        lede="Sentence pairs between English and each language. A pair counts as translated once a volunteer submits it, and as verified once a second speaker approves it. Counts update live."
        layout="split"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {board && <LanguageBoard languages={board.languages} progress={board.progress} />}
    </section>
  );
}

export { DataLabHome };
