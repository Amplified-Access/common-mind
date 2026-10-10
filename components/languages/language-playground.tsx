"use client";

import { useState } from "react";

import { playgroundModels } from "@/components/playground/data";
import { Translator } from "@/components/playground/translator";
import { SectionHeader } from "@/components/system/primitives";

// The heading names whichever model is selected in the playground.
function LanguagePlayground({ initialModel }: { initialModel: string }) {
  const [modelSlug, setModelSlug] = useState(initialModel);
  const model =
    playgroundModels.find((m) => m.slug === modelSlug) ?? playgroundModels[0];

  return (
    <>
      <SectionHeader eyebrow="Playground" title={`Try the ${model.name} model`} />
      <Translator initialModel={initialModel} onModelChange={setModelSlug} />
    </>
  );
}

export { LanguagePlayground };
