"use client";

import { useState } from "react";

import { playgroundModels } from "@/components/playground/data";
import { Translator } from "@/components/playground/translator";
import { SectionHeader } from "@/components/system/primitives";
import { fill } from "@/lib/copy/fill";
import type { PageCopy } from "@/lib/copy/pages";

// The heading names whichever model is selected in the playground.
function LanguagePlayground({
  initialModel,
  copy,
}: {
  initialModel: string;
  copy: PageCopy<"languageDetail">["playground"];
}) {
  const [modelSlug, setModelSlug] = useState(initialModel);
  const model =
    playgroundModels.find((m) => m.slug === modelSlug) ?? playgroundModels[0];

  return (
    <>
      <SectionHeader eyebrow={copy.eyebrow} title={fill(copy.title, { model: model.name })} />
      <Translator initialModel={initialModel} onModelChange={setModelSlug} />
    </>
  );
}

export { LanguagePlayground };
