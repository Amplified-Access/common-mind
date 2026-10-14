"use client";

import Link from "next/link";
import { useState } from "react";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow, SectionHeader } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";
import { LanguageBoard, LanguageStatus } from "./language-board";
import { Onboarding } from "./onboarding";
import { SignIn } from "./sign-in";
import { primaryButton, quietButton, secondaryButton } from "./styles";
import { canReview, type Language, type LanguageProgress, type Volunteer } from "./types";
import { useProgress } from "./use-progress";
import { useVolunteer } from "./use-volunteer";

const levelLabel = { contributor: "Contributor", reviewer: "Reviewer", lead: "Language lead" } as const;

function DataLabHome() {
  const { signOut } = useAuth();
  const { state, refresh } = useVolunteer();
  const { board, error: boardError } = useProgress();
  const [editing, setEditing] = useState(false);

  const languages = board?.languages ?? [];

  return (
    <div className="flex flex-col gap-(--section-pad)">
      {state.status === "loading" && <p className="font-mono text-xs text-faint">Loading…</p>}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "signed-out" && <SignIn />}
      {state.status === "onboarding" && board && <Onboarding languages={languages} onDone={refresh} />}
      {state.status === "ready" &&
        (editing || !state.consentCurrent ? (
          <Onboarding
            languages={languages}
            volunteer={state.volunteer}
            onDone={() => {
              setEditing(false);
              refresh();
            }}
          />
        ) : (
          <YourLanguages
            volunteer={state.volunteer}
            languages={languages}
            progress={board?.progress ?? {}}
            onEdit={() => setEditing(true)}
            onSignOut={signOut}
          />
        ))}

      <section className="flex flex-col gap-8">
        <SectionHeader
          eyebrow="Languages"
          title="Progress in every language"
          lede="Counts update live as volunteers contribute and review. A language opens for contributions once it has two reviewers."
          layout="split"
        />
        {boardError && <p className="text-sm text-destructive">{boardError}</p>}
        {board && <LanguageBoard languages={languages} progress={board.progress} />}
      </section>
    </div>
  );
}

function YourLanguages({
  volunteer,
  languages,
  progress,
  onEdit,
  onSignOut,
}: {
  volunteer: Volunteer;
  languages: Language[];
  progress: Record<string, LanguageProgress>;
  onEdit: () => void;
  onSignOut: () => void;
}) {
  const byCode = Object.fromEntries(languages.map((l) => [l.code, l]));
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Eyebrow>Signed in as {volunteer.name}</Eyebrow>
          <h2 className="text-h2">Your languages</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className={secondaryButton}>
            Add languages
          </button>
          <button type="button" onClick={onSignOut} className={quietButton}>
            Sign out
          </button>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {volunteer.languages.map((m) => {
          const lang = byCode[m.language_code];
          const p = progress[m.language_code];
          return (
            <li key={m.language_code}>
              <FramedCard className="h-full" panelsClassName="flex h-full flex-col gap-6 bg-[#1c1a0e] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-h3">{lang?.native_name ?? m.language_code}</span>
                    <span className="font-mono text-xs text-faint">
                      {lang?.name} · {levelLabel[m.level]}
                    </span>
                  </div>
                  <LanguageStatus progress={p} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {p?.open ? (
                    <Link href={`/data-lab/contribute/${m.language_code}`} className={primaryButton}>
                      Contribute
                    </Link>
                  ) : (
                    <p className="max-w-xs text-sm text-subtle">
                      Contributions open once this language has two reviewers.
                    </p>
                  )}
                  {canReview(m.level) && (
                    <Link href={`/data-lab/review/${m.language_code}`} className={secondaryButton}>
                      Review{p?.pending ? ` · ${p.pending}` : ""}
                    </Link>
                  )}
                </div>
              </FramedCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export { DataLabHome };
