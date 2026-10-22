"use client";

import Link from "next/link";

import { Eyebrow, FramedCard } from "@/components/ui/card";

import { useVolunteerReady } from "./lab-app";
import { PairsBar } from "./pairs-bar";
import { primaryButton, secondaryButton } from "./styles";
import { canReview } from "./types";
import { useProgress } from "./use-progress";

const levelLabel = { contributor: "Contributor", reviewer: "Reviewer", lead: "Language lead" } as const;

/** A volunteer's languages, each with its progress and what they can do in it. */
function Workspace() {
  const volunteer = useVolunteerReady();
  const { board } = useProgress();
  const byCode = Object.fromEntries((board?.languages ?? []).map((l) => [l.code, l]));

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Eyebrow>Workspace</Eyebrow>
          <h1 className="text-h2">Your languages</h1>
        </div>
        <Link href="/welcome" className={secondaryButton}>
          Add languages
        </Link>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {volunteer.languages.map((m) => {
          const lang = byCode[m.language_code];
          const p = board?.progress[m.language_code];
          return (
            <li key={m.language_code}>
              <FramedCard className="h-full" panelsClassName="flex h-full flex-col gap-6 bg-surface p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-h3">{lang?.native_name ?? m.language_code}</span>
                  <span className="font-mono text-xs text-faint">
                    {lang?.name} · {levelLabel[m.level]}
                  </span>
                </div>
                {p && (
                  <PairsBar
                    language={lang?.name ?? m.language_code}
                    available={p.available}
                    translated={p.translated}
                    verified={p.verified}
                  />
                )}
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={`/contribute/${m.language_code}`} className={primaryButton}>
                    Contribute
                  </Link>
                  {canReview(m.level) && (
                    <Link href={`/review/${m.language_code}`} className={secondaryButton}>
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

export { Workspace };
