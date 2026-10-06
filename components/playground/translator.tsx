"use client";

import { TranslateIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

import { DirectionLabel, Segmented } from "@/components/system/segmented";
import { cn } from "@/lib/utils";

import { playgroundModels, type Example } from "./data";

type Status = "idle" | "loading" | "error";

const MAX_CHARS = 500;

type TranslatorProps = {
  initialModel?: string;
  /** Pin the playground to one model: its name replaces the model picker. */
  locked?: boolean;
};

function Translator({ initialModel, locked = false }: TranslatorProps) {
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
    <div className="relative isolate overflow-hidden rounded-lg border border-line bg-surface">
      {/* A faint grid behind the input, as on the design. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid mask-[radial-gradient(40%_50%_at_40%_60%,#000_0%,transparent_100%)]"
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-5 px-5 pt-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        {locked ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <h3 className="text-h3">{model.name}</h3>
            <DirectionToggle
              directions={model.directions}
              value={direction.code}
              onChange={(code) => {
                setDirectionCode(code);
                reset();
              }}
            />
          </div>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="Model"
              className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:px-0"
            >
              {playgroundModels.map((m) => {
                const selected = m.slug === model.slug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleModelChange(m.slug)}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full border px-4 py-1.5 font-mono text-xs transition-colors",
                      selected
                        ? "border-signal bg-signal text-background"
                        : "border-signal/70 text-signal hover:bg-signal/10",
                    )}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
            <DirectionToggle
              directions={model.directions}
              value={direction.code}
              onChange={(code) => {
                setDirectionCode(code);
                reset();
              }}
            />
          </>
        )}
      </div>

      {/* Panes */}
      <div className="grid gap-4 p-3 pt-4 md:grid-cols-2 md:gap-0 md:pt-6">
        <div className="flex min-h-72 flex-col">
          <div className="flex items-center justify-between px-3 pt-2 sm:px-4">
            <span className="text-[13px]">{direction.from}</span>
            <span className="text-[13px] text-foreground/80 tabular-nums">
              {input.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTranslate();
            }}
            placeholder={`Type a sentence in ${direction.from}`}
            aria-label={`Text in ${direction.from}`}
            rows={5}
            className="w-full flex-1 resize-none bg-transparent px-3 py-5 text-2xl leading-snug text-foreground outline-none placeholder:text-foreground/25 sm:px-4 md:text-[1.75rem]"
          />
          {examples.length > 0 && (
            <div className="flex flex-wrap gap-2.5 px-3 pb-2 sm:px-4">
              {examples.map((ex) => (
                <button
                  key={ex.source}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="cursor-pointer rounded-md bg-[#1b1b1b] px-2.5 py-1.5 font-mono text-[11px] text-faint transition-colors hover:text-foreground"
                >
                  {ex.source.length > 40 ? `${ex.source.slice(0, 40)}…` : ex.source}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-64 flex-col rounded-md border border-line bg-background">
          <div className="flex items-center justify-between px-4 pt-5 sm:px-6">
            <span className="text-[13px]">{direction.to}</span>
            {latency !== null && (
              <span className="font-mono text-[11px] text-faint tabular-nums">
                {latency} ms
              </span>
            )}
          </div>
          <div className="flex-1 px-4 py-5 sm:px-6" aria-live="polite">
            {status === "loading" && (
              <span className="flex items-center gap-2 font-mono text-sm text-faint">
                <span className="size-1.5 animate-[cm-pulse_1s_ease-in-out_infinite] rounded-full bg-signal" />
                Running {model.name}…
              </span>
            )}
            {status === "idle" && translation === null && (
              <span className="text-2xl leading-snug text-foreground/25 md:text-[1.75rem]">
                The translation will appear here
              </span>
            )}
            {status === "idle" && translation !== null && (
              <p className="text-2xl leading-snug text-foreground md:text-[1.75rem]">
                {translation}
              </p>
            )}
            {status === "error" && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-3 pb-5 sm:px-7">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={!input.trim() || status === "loading"}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-3 rounded-full bg-foreground px-5 text-lg text-background transition-colors hover:bg-signal disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:bg-foreground"
        >
          {status === "loading" ? "Translating…" : "Translate"}
          <HugeiconsIcon icon={TranslateIcon} className="size-5" />
        </button>
      </div>
    </div>
  );
}

function DirectionToggle({
  directions,
  value,
  onChange,
}: {
  directions: { code: string; from: string; to: string }[];
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <Segmented
      label="Direction"
      value={value}
      onChange={onChange}
      items={directions.map((d) => ({
        id: d.code,
        label: <DirectionLabel from={d.from} to={d.to} />,
      }))}
    />
  );
}

export { Translator };
