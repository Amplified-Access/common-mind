"use client";

import {
  ClosedCaptionIcon,
  Mic01Icon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FramedCard } from "@/components/system/framed-card";
import { Segmented } from "@/components/system/segmented";
import { CHARACTERS, type Character } from "@/lib/sign/characters";
import { LEXICON } from "@/lib/sign/lexicon";
import { type Plan, planSigns } from "@/lib/sign/plan";
import { type Body, DEFAULT_BODY } from "@/lib/sign/body";
import { type Timeline, activeItem, buildTimeline } from "@/lib/sign/timeline";
import { cn } from "@/lib/utils";

import { SignStage } from "./sign-stage";
import { useSpeech } from "./use-speech";

const SPEEDS = [
  { id: "0.5", label: "0.5x" },
  { id: "0.75", label: "0.75x" },
  { id: "1", label: "1x" },
  { id: "1.25", label: "1.25x" },
];

const EXAMPLES = ["Hello, my name is Grace", "Thank you, friend", "What is your name?", "Are you deaf?", "I love you"];

const HISTORY_KEY = "sign:recent";
const SIGNER_KEY = "sign:signer";

// Per-viewer conveniences: the signer they chose and what they signed lately.
function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is off; the page works without it.
  }
}

type Current = { text: string; plan: Plan };

const GLOSSES = [...new Set(LEXICON.map((s) => s.gloss))].sort();

function SignStudio() {
  const [text, setText] = useState("");
  const [current, setCurrent] = useState<Current | null>(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState("1");
  const [captions, setCaptions] = useState(true);
  const [signer, setSigner] = useState<Character>(CHARACTERS[0]);
  // The loaded avatar's measurements: each sign is placed on its body.
  const [body, setBody] = useState<Body>(DEFAULT_BODY);
  const [history, setHistory] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const progressRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(-1);

  const sign = useCallback((input: string) => {
    const clean = input.trim();
    if (!clean) return;
    const plan = planSigns(clean);
    if (plan.items.length === 0) return;
    setCurrent({ text: clean, plan });
    setRun((r) => r + 1);
    setPlaying(true);
    setPaused(false);
    setHistory((h) => {
      const next = [clean, ...h.filter((x) => x !== clean)].slice(0, 8);
      store(HISTORY_KEY, next);
      return next;
    });
  }, []);

  // Restore the viewer's signer and recent list, then sign ?text= if given,
  // so a link can open straight onto a phrase being signed (and ?signer=
  // can choose who signs it).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("signer") ?? readStored<string | null>(SIGNER_KEY, null);
    const saved = CHARACTERS.find((c) => c.id === id);
    const initial = params.get("text");
    queueMicrotask(() => {
      if (saved) setSigner(saved);
      setHistory(readStored<string[]>(HISTORY_KEY, []));
      if (initial) {
        setText(initial);
        sign(initial);
      }
    });

  }, [sign]);

  const speech = useSpeech(
    useCallback(
      (heard: string, final: boolean) => {
        setText(heard);
        if (final) sign(heard);
      },
      [sign],
    ),
  );

  const onFrame = useCallback((t: number, tl: Timeline) => {
    if (progressRef.current) progressRef.current.style.width = `${(t / tl.duration) * 100}%`;
    const i = activeItem(tl, t);
    if (i !== activeRef.current) {
      activeRef.current = i;
      setActive(i);
    }
  }, []);

  const onEnd = useCallback(() => {
    setPlaying(false);
    activeRef.current = -1;
    setActive(-1);
  }, []);

  const chooseSigner = (c: Character) => {
    setSigner(c);
    store(SIGNER_KEY, c.id);
  };

  const status = playing ? (paused ? "Paused" : "Signing") : "Ready";
  const timeline = useMemo(() => (current ? buildTimeline(current.plan, body) : null), [current, body]);
  const items = timeline?.items ?? [];

  return (
    <div className="flex min-h-svh flex-col bg-background lg:h-svh">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="CommonMind home" className="shrink-0">
            <Image src="/logo-white.svg" alt="CommonMind" width={225} height={37} priority className="h-6 w-auto" />
          </Link>
          <span className="hidden h-5 w-px bg-line sm:block" />
          <span className="hidden font-mono text-xs text-subtle uppercase sm:block">Sign</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            title="American Sign Language"
            className="inline-flex h-7 items-center rounded-full border border-signal-deep/60 px-3 font-mono text-xs leading-none text-signal"
          >
            ASL
          </span>
          <button
            type="button"
            onClick={() => setCaptions((c) => !c)}
            aria-pressed={captions}
            aria-label="Captions"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full border transition-colors",
              captions ? "border-signal bg-signal text-background" : "border-line text-subtle hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={ClosedCaptionIcon} size={16} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 p-4 md:p-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="order-2 flex min-h-0 flex-col gap-4 lg:order-1 lg:overflow-y-auto">
          <FramedCard panelsClassName="bg-[#0b0a07] p-3">
            <h2 className="mb-3 font-mono text-xs text-signal uppercase">Signer</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
              {CHARACTERS.map((c) => {
                const selected = c.id === signer.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => chooseSigner(c)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-inset border p-2 text-left transition-colors",
                        selected ? "border-signal bg-signal/10" : "border-line hover:border-line-strong hover:bg-white/4",
                      )}
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-full border border-line bg-[radial-gradient(circle_at_50%_40%,#3a3833,#121110)]">
                        <Image src={c.portrait} alt="" width={48} height={48} className="size-full object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-sm", selected ? "text-signal" : "text-foreground")}>{c.name}</span>
                        <span className="block truncate font-mono text-[0.6875rem] text-subtle">
                          {selected ? "Signing" : c.look}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </FramedCard>

          <FramedCard panelsClassName="bg-[#0b0a07] p-3">
            <h2 className="mb-1 font-mono text-xs text-signal uppercase">Signs it knows</h2>
            <p className="mb-3 text-xs text-subtle">Other words are fingerspelled.</p>
            <ul className="flex flex-wrap gap-1.5">
              {GLOSSES.map((g) => (
                <li key={g}>
                  <button
                    type="button"
                    onClick={() => {
                      const word = LEXICON.find((s) => s.gloss === g)?.words[0] ?? g.toLowerCase();
                      setText(word);
                      sign(word);
                    }}
                    className="inline-flex h-6 items-center rounded-full border border-line px-2 font-mono text-[0.6875rem] leading-none text-foreground/85 transition-colors hover:border-signal hover:text-signal"
                  >
                    {g}
                  </button>
                </li>
              ))}
            </ul>
          </FramedCard>

          {history.length > 0 && (
            <FramedCard panelsClassName="bg-[#0b0a07] p-3">
              <h2 className="mb-2 font-mono text-xs text-signal uppercase">Recent</h2>
              <ul className="flex flex-col">
                {history.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => {
                        setText(h);
                        sign(h);
                      }}
                      className="w-full truncate py-1.5 text-left text-sm text-foreground/85 transition-colors hover:text-signal"
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
            </FramedCard>
          )}
        </aside>

        <main className="order-1 flex min-h-0 flex-col gap-3 lg:order-2">
          <FramedCard className="min-h-112 flex-1 lg:min-h-0" panelsClassName="relative bg-[radial-gradient(ellipse_at_50%_30%,#3b3934_0%,#1a1915_50%,#0b0a07_100%)]">
            <SignStage
              character={signer}
              timeline={timeline}
              run={run}
              speed={Number(speed)}
              paused={paused}
              onFrame={onFrame}
              onEnd={onEnd}
              onBody={setBody}
              className="absolute inset-0"
            />

            <div className="absolute top-3 left-3 flex items-center gap-2.5 rounded-full border border-line bg-background/70 py-1.5 pr-3 pl-2.5 backdrop-blur">
              <span className={cn("size-1.5 rounded-full", playing && !paused ? "bg-signal" : "bg-subtle")} />
              <span className="font-mono text-xs leading-none">{status}</span>
              {playing && (
                <span className="relative h-1 w-16 overflow-hidden rounded-full bg-white/10">
                  <span ref={progressRef} className="absolute inset-y-0 left-0 bg-signal" />
                </span>
              )}
            </div>

            {current && (
              <div className="absolute top-3 right-3 flex gap-2">
                {playing && (
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? "Resume" : "Pause"}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-background/70 backdrop-blur transition-colors hover:text-signal"
                  >
                    <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => sign(current.text)}
                  aria-label="Sign again"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-background/70 backdrop-blur transition-colors hover:text-signal"
                >
                  <HugeiconsIcon icon={RepeatIcon} size={15} />
                </button>
              </div>
            )}

            {captions && current && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-4 pt-14 pb-4 text-center">
                <p className="mx-auto max-w-2xl text-sm text-foreground/75">{current.text}</p>
                <p className="mx-auto mt-1.5 flex max-w-3xl flex-wrap justify-center gap-x-2.5 gap-y-1 font-mono text-base font-medium sm:text-lg">
                  {items.map((item, i) => (
                    <span
                      key={`${item.gloss}-${i}`}
                      className={cn(
                        "transition-colors duration-150",
                        i === active ? "text-signal" : playing && i < active ? "text-foreground/45" : "text-foreground",
                      )}
                    >
                      {item.gloss}
                    </span>
                  ))}
                  {current.plan.mood !== "statement" && <span className="text-foreground/60">?</span>}
                </p>
              </div>
            )}
          </FramedCard>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sign(text);
            }}
            className="flex shrink-0 items-center gap-2 rounded-card border border-line bg-[#0b0a07] p-1.5 pl-4 focus-within:border-signal-deep"
          >
            <label htmlFor="sign-text" className="sr-only">
              Text to sign
            </label>
            <input
              id="sign-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={speech.listening ? "Listening…" : "Type a sentence to sign"}
              autoComplete="off"
              maxLength={280}
              className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
            />
            {speech.supported && (
              <button
                type="button"
                onClick={speech.listening ? speech.stop : speech.start}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? "Stop listening" : "Speak instead"}
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-inset transition-colors",
                  speech.listening ? "bg-signal/15 text-signal" : "text-subtle hover:text-foreground",
                )}
              >
                <HugeiconsIcon icon={Mic01Icon} size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex h-10 shrink-0 items-center chamfer bg-signal px-5 font-mono text-xs text-background transition-colors hover:bg-signal/85 disabled:opacity-40"
            >
              Sign it
            </button>
          </form>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => {
                      setText(ex);
                      sign(ex);
                    }}
                    className="inline-flex h-7 items-center rounded-full border border-line px-3 text-xs leading-none text-foreground/80 transition-colors hover:border-signal hover:text-signal"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
            <Segmented items={SPEEDS} value={speed} onChange={setSpeed} label="Signing speed" />
          </div>
        </main>
      </div>

      <footer className="shrink-0 px-4 pb-4 font-mono text-[0.6875rem] text-subtle md:px-6">
        Signs are hand-written ASL citation forms, awaiting review by Deaf signers. Avatars from the{" "}
        <a
          href="https://github.com/microsoft/Microsoft-Rocketbox"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-signal"
        >
          Microsoft Rocketbox library
        </a>{" "}
        (MIT).
      </footer>
    </div>
  );
}

export { SignStudio };
