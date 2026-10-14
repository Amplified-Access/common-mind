import { FramedCard } from "@/components/system/framed-card";

import type { Language, LanguageProgress } from "./types";

/** Every target language with its sentence pairs with English, live. */
function LanguageBoard({
  languages,
  progress,
}: {
  languages: Language[];
  progress: Record<string, LanguageProgress>;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {languages.map((l) => {
        const p = progress[l.code];
        return (
          <li key={l.code}>
            <FramedCard className="h-full" panelsClassName="flex h-full flex-col gap-6 bg-[#0b0a07] p-5">
              <div className="flex flex-col gap-1">
                <span className="text-lg">{l.native_name}</span>
                <span className="font-mono text-[11px] text-faint">{l.name}</span>
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <span className="font-mono text-[11px] text-faint">English–{l.name} sentence pairs</span>
                <dl className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <Stat label="Translated" value={p?.translated} />
                  <Stat label="Verified" value={p?.verified} />
                </dl>
              </div>
            </FramedCard>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-faint">{label}</dt>
      <dd className="text-xl text-foreground tabular-nums">{(value ?? 0).toLocaleString("en-US")}</dd>
    </div>
  );
}

export { LanguageBoard };
