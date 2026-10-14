"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { civicCategories } from "@/components/civic/data";
import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

import { ApiError, dataLabApi } from "./api";
import { useAuth } from "./auth-provider";
import { RedirectToSignIn } from "./redirect-to-sign-in";
import { primaryButton, quietButton } from "./styles";
import type { Language, Task } from "./types";

const MAX_CHARS = 2000;

const categoryLabel = (id: string) => civicCategories.find((c) => c.id === id)?.label ?? id;

type View =
  | { status: "loading" }
  | { status: "task"; task: Task }
  | { status: "empty" }
  | { status: "blocked"; message: string };

function Contribute({ language }: { language: string }) {
  const { user, loading, getToken } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [view, setView] = useState<View>({ status: "loading" });
  const [text, setText] = useState("");
  const [pasted, setPasted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(0);
  const editor = useRef<HTMLTextAreaElement>(null);

  const target = languages.find((l) => l.code === language);
  const nameOf = (code: string) => languages.find((l) => l.code === code)?.name ?? code;

  useEffect(() => {
    dataLabApi.languages().then(setLanguages, () => setLanguages([]));
  }, []);

  const fetchTask = useCallback(async (): Promise<View> => {
    try {
      return { status: "task", task: await dataLabApi.nextTask(await getToken(), language) };
    } catch (err) {
      if (err instanceof ApiError && err.code === "no_tasks") return { status: "empty" };
      return { status: "blocked", message: err instanceof Error ? err.message : "Something went wrong." };
    }
  }, [getToken, language]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchTask().then((next) => !cancelled && setView(next));
    return () => {
      cancelled = true;
    };
  }, [user, fetchTask]);

  const next = async () => {
    setText("");
    setPasted(false);
    setError(null);
    setView({ status: "loading" });
    setView(await fetchTask());
  };

  const submit = async (task: Task) => {
    setBusy(true);
    setError(null);
    try {
      await dataLabApi.contribute(await getToken(), {
        item_id: task.item_id,
        language,
        text,
        pasted,
      });
      setSubmitted((n) => n + 1);
      await next();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  // Inserts a palette character at the cursor and keeps focus in the editor.
  const insert = (ch: string) => {
    const el = editor.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + ch + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  // Signed-out visitors sign in on their own page and come back here.
  if (!loading && !user) return <RedirectToSignIn next={`/data-lab/contribute/${language}`} />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Link href="/data-lab" className="font-mono text-xs text-signal hover:text-foreground">
            ← Data Lab
          </Link>
          <h1 className="text-h2">{target?.native_name ?? language}</h1>
        </div>
        {submitted > 0 && (
          <span className="font-mono text-xs text-subtle">
            {submitted} submitted for review this session
          </span>
        )}
      </div>

      {view.status === "loading" && <p className="font-mono text-xs text-faint">Loading the next task…</p>}

      {view.status === "empty" && (
        <FramedCard panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
          <p className="text-lg">You&apos;ve done every task in {target?.name ?? language} for now.</p>
          <p className="pt-2 text-sm text-subtle">New items are added regularly. Check back soon.</p>
        </FramedCard>
      )}

      {view.status === "blocked" && (
        <FramedCard panelsClassName="flex flex-col items-start gap-4 bg-[#1c1a0e] p-6 sm:p-8">
          <p className="text-lg">{view.message}</p>
          <Link href="/data-lab" className={primaryButton}>
            Back to the Data Lab
          </Link>
        </FramedCard>
      )}

      {view.status === "task" && (
        <FramedCard panelsClassName="grid bg-[#0b0a07] md:grid-cols-2">
          <div className="flex flex-col gap-5 bg-[#1c1a0e] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Eyebrow>
                {view.task.kind === "translate"
                  ? `Translate from ${nameOf(view.task.text_language)}`
                  : `Write in ${target?.name ?? language}`}
              </Eyebrow>
              <span className="font-mono text-xs text-faint">{categoryLabel(view.task.category)}</span>
            </div>
            <p lang={view.task.text_language} className="text-2xl leading-snug text-pretty">
              {view.task.text}
            </p>
            {view.task.kind === "write" && (
              <p className="mt-auto text-sm text-subtle">
                Answer in your own words, as you would say it to a neighbour.
              </p>
            )}
          </div>

          <form
            className="flex flex-col gap-4 p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              submit(view.task);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-faint">{target?.name ?? language}</span>
              <span className="font-mono text-xs text-faint tabular-nums">
                {text.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              ref={editor}
              lang={language}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              onPaste={() => setPasted(true)}
              rows={7}
              autoFocus
              aria-label={`Your text in ${target?.name ?? language}`}
              placeholder={view.task.kind === "translate" ? "Write the translation" : "Write your answer"}
              className="min-h-48 w-full flex-1 resize-none bg-transparent text-xl leading-snug text-foreground outline-none placeholder:text-foreground/25"
            />
            {target && target.extra_characters.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Insert a character">
                {target.extra_characters.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insert(ch)}
                    className="size-9 cursor-pointer rounded-inset border border-line text-lg transition-colors hover:border-signal hover:text-signal"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button type="button" onClick={next} disabled={busy} className={quietButton}>
                Skip
              </button>
              <button type="submit" disabled={busy || !text.trim()} className={cn(primaryButton, "min-w-32")}>
                {busy ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </FramedCard>
      )}
    </div>
  );
}

export { Contribute };
