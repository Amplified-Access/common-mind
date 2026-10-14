import { FramedCard } from "@/components/system/framed-card";
import { StatusDot } from "@/components/system/primitives";

import type { Language, LanguageProgress } from "./types";

const REVIEWERS_TO_OPEN = 2;

function LanguageStatus({ progress }: { progress?: LanguageProgress }) {
  if (!progress) return null;
  if (progress.open) return <StatusDot label="Open" className="shrink-0" />;
  return (
    <StatusDot
      tone="muted"
      label={`${progress.reviewers} of ${REVIEWERS_TO_OPEN} reviewers`}
      className="shrink-0 whitespace-nowrap"
    />
  );
}

/** Every target language with its live counts. */
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
            <FramedCard className="h-full" panelsClassName="flex h-full flex-col gap-5 bg-[#0b0a07] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-lg">{l.native_name}</span>
                  <span className="font-mono text-[11px] text-faint">{l.name}</span>
                </div>
                <LanguageStatus progress={p} />
              </div>
              <dl className="mt-auto grid grid-cols-3 gap-3 font-mono text-xs">
                <Stat label="Verified" value={p?.verified} />
                <Stat label="In review" value={p?.pending} />
                <Stat label="Volunteers" value={p?.contributors} />
              </dl>
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
      <dd className="text-base text-foreground tabular-nums">{(value ?? 0).toLocaleString("en-US")}</dd>
    </div>
  );
}

export { LanguageBoard, LanguageStatus };
