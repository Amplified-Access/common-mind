"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "commonmind_preview_api_key";

function generateKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `cm_preview_${hex}`;
}

function ApiKeyCard() {
  const [key, setKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setKey(stored);
    } catch {
      // localStorage unavailable (private browsing, etc.); key just won't persist.
    }
  }, []);

  const handleGenerate = () => {
    const next = generateKey();
    setKey(next);
    setRevealed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore; key still works for this session
    }
  };

  const handleCopy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const masked = key ? `${key.slice(0, 11)}${"•".repeat(24)}` : null;

  return (
    <div className="rounded-3xl bg-white p-8 sm:p-12">
      {!key ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-black/70">
            No API key yet, generate a preview key to see what the flow will
            look like.
          </p>
          <Button onClick={handleGenerate}>Generate preview key →</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Your preview key
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-xl border border-black/10 bg-[#f4f4f4] px-4 py-3 font-mono text-sm text-black">
              {revealed ? key : masked}
            </code>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="text-sm font-medium text-black/60 underline underline-offset-4 hover:text-black"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="text-sm font-medium text-black/60 underline underline-offset-4 hover:text-black"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              Generate new key
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { ApiKeyCard };
