"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { playgroundModels, type Example } from "./data";

type Status = "idle" | "loading" | "error";

const MAX_CHARS = 500;

function Translator({ initialModel }: { initialModel?: string }) {
  const startModel =
    playgroundModels.find((m) => m.slug === initialModel) ?? playgroundModels[0];
  const [modelSlug, setModelSlug] = useState(startModel.slug);
  const model =
    playgroundModels.find((m) => m.slug === modelSlug) ?? playgroundModels[0];

  const [directionCode, setDirectionCode] = useState(model.directions[0].code);
  const direction =
    model.directions.find((d) => d.code === directionCode) ??
    model.directions[0];

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const examples = useMemo(
    () => model.examples[direction.code] ?? [],
    [model, direction],
  );

  const reset = () => {
    setTranslation(null);
    setError(null);
    setLatency(null);
  };

  const handleModelChange = (nextSlug: string) => {
    const nextModel =
      playgroundModels.find((m) => m.slug === nextSlug) ?? playgroundModels[0];
    setModelSlug(nextModel.slug);
    setDirectionCode(nextModel.directions[0].code);
    reset();
  };

  const handleExampleClick = (example: Example) => {
    setInput(example.source);
    reset();
  };

  const handleTranslate = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus("loading");
    reset();
    const started = performance.now();

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug: model.slug,
          text: trimmed,
          direction: direction.code,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setTranslation(body.translation);
      setLatency(Math.round(performance.now() - started));
      setStatus("idle");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-surface">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 px-6 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {playgroundModels.map((m) => (
            <button
              key={m.slug}
              type="button"
              onClick={() => handleModelChange(m.slug)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors",
                m.slug === model.slug
                  ? "bg-signal font-medium text-background"
                  : "bg-white/5 text-subtle hover:text-foreground",
              )}
            >
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {model.directions.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => {
                setDirectionCode(d.code);
                reset();
              }}
              disabled={model.directions.length === 1}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors disabled:cursor-default",
                d.code === direction.code
                  ? "bg-white/8 text-foreground"
                  : "text-faint hover:text-subtle",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panes */}
      <div className="grid md:grid-cols-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-6 pt-8 sm:px-8">
            <span className="text-sm text-faint">{direction.from}</span>
            <span className="font-mono text-[11px] text-faint tabular-nums">
              {input.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTranslate();
            }}
            placeholder={`Type a sentence in ${direction.from}…`}
            rows={6}
            className="w-full flex-1 resize-none bg-transparent px-6 py-4 text-xl text-foreground outline-none placeholder:text-faint sm:px-8"
          />
          {examples.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pb-6 sm:px-8">
              {examples.map((ex) => (
                <button
                  key={ex.source}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="cursor-pointer rounded-full bg-white/5 px-3 py-1.5 text-xs text-subtle transition-colors hover:text-foreground"
                >
                  {ex.source.length > 36 ? `${ex.source.slice(0, 36)}…` : ex.source}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="m-2 flex min-h-48 flex-col rounded-[1.25rem] bg-background/60">
          <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
            <span className="text-sm text-faint">{direction.to}</span>
            {latency !== null && (
              <span className="font-mono text-[11px] text-faint tabular-nums">
                {latency} ms
              </span>
            )}
          </div>
          <div className="flex-1 px-6 py-4 sm:px-8" aria-live="polite">
            {status === "loading" && (
              <span className="flex items-center gap-2 text-sm text-faint">
                <span className="size-1.5 animate-[cm-pulse_1s_ease-in-out_infinite] rounded-full bg-signal" />
                Running {model.name}…
              </span>
            )}
            {status === "idle" && translation === null && (
              <span className="text-sm text-faint">
                The translation will appear here.
              </span>
            )}
            {status === "idle" && translation !== null && (
              <p className="text-xl text-foreground">{translation}</p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-6 pb-6 sm:px-8">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={!input.trim() || status === "loading"}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Translating…" : "Translate"}
          <kbd className="hidden font-mono text-[10px] opacity-60 sm:inline">⌘↵</kbd>
        </button>
      </div>
    </div>
  );
}

export { Translator };
