"use client";

import { useActionState } from "react";

import { cn } from "@/lib/utils";

import type { Level } from "../types";
import { type LevelState, setTranslatorLevel } from "./actions";
import { levelLabel } from "./format";

const LEVELS: readonly Level[] = ["contributor", "reviewer", "lead"];

/**
 * A volunteer's level in one language, as three buttons: pressing another
 * level saves it straight away. Reviewers and leads review others' work in
 * the language.
 */
function LevelControl({ id, language, level, name }: { id: number; language: string; level: Level; name: string }) {
  const [state, action, pending] = useActionState<LevelState, FormData>(setTranslatorLevel, { error: null });

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="language" value={language} />
      <div
        role="group"
        aria-label={`Level in ${name}`}
        className="inline-flex gap-1 rounded-full border border-line-strong p-1"
      >
        {LEVELS.map((l) => {
          const current = l === level;
          return (
            <button
              key={l}
              type="submit"
              name="level"
              value={l}
              aria-pressed={current}
              disabled={pending || current}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs transition-colors",
                current
                  ? "bg-signal text-background"
                  : "cursor-pointer text-subtle hover:text-foreground disabled:cursor-wait",
              )}
            >
              {levelLabel[l]}
            </button>
          );
        })}
      </div>
      {pending && <span className="font-mono text-xs text-faint">Saving…</span>}
      {state.error && (
        <span role="alert" className="font-mono text-xs text-destructive">
          {state.error}
        </span>
      )}
    </form>
  );
}

export { LevelControl };
