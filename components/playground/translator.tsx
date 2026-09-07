"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import { playgroundModels, type Example } from "./data";

type Status = "idle" | "loading" | "error";

const MAX_CHARS = 500;

function Translator() {
  const [modelSlug, setModelSlug] = useState(playgroundModels[0].slug);
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

  const examples = useMemo(
    () => model.examples[direction.code] ?? [],
    [model, direction],
  );

  const handleModelChange = (nextSlug: string) => {
    const nextModel =
      playgroundModels.find((m) => m.slug === nextSlug) ?? playgroundModels[0];
    setModelSlug(nextModel.slug);
    setDirectionCode(nextModel.directions[0].code);
    setTranslation(null);
    setError(null);
  };

  const handleDirectionChange = (code: string) => {
    setDirectionCode(code);
    setTranslation(null);
    setError(null);
  };

  const handleExampleClick = (example: Example) => {
    setInput(example.source);
    setTranslation(null);
    setError(null);
  };

  const handleTranslate = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus("loading");
    setTranslation(null);
    setError(null);

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
      setStatus("idle");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 sm:p-12">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Model
          </span>
          <select
            value={modelSlug}
            onChange={(e) => handleModelChange(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black outline-none focus-visible:border-black/30"
          >
            {playgroundModels.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        {model.directions.length > 1 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
              Direction
            </span>
            <select
              value={direction.code}
              onChange={(e) => handleDirectionChange(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black outline-none focus-visible:border-black/30"
            >
              {model.directions.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {examples.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Try an example:</span>
          {examples.map((ex) => (
            <button
              key={ex.source}
              type="button"
              onClick={() => handleExampleClick(ex)}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-black/20 hover:text-black"
            >
              {ex.source.length > 40 ? `${ex.source.slice(0, 40)}…` : ex.source}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            {direction.from}
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            placeholder={`Type a sentence in ${direction.from}…`}
            rows={6}
            className="w-full resize-none rounded-2xl border border-black/10 bg-[#f4f4f4] p-4 text-black outline-none focus-visible:border-black/30"
          />
          <span className="text-right text-xs text-gray-400">
            {input.length}/{MAX_CHARS}
          </span>
        </div>

        <div className="flex justify-center lg:rotate-0">
          <Button
            onClick={handleTranslate}
            disabled={!input.trim() || status === "loading"}
            size="lg"
          >
            {status === "loading" ? "Translating…" : "Translate →"}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            {direction.to}
          </span>
          <div className="min-h-[152px] w-full rounded-2xl border border-black/10 bg-[#f4f4f4] p-4 text-black">
            {status === "loading" && (
              <span className="text-gray-400">
                Translating… the model may still be warming up.
              </span>
            )}

            {status === "idle" && translation === null && (
              <span className="text-gray-400">
                Your translation will appear here.
              </span>
            )}

            {status === "idle" && translation !== null && <p>{translation}</p>}

            {status === "error" && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Translator };
