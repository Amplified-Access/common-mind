"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { civicCategories } from "@/components/civic/data";
import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

import { ApiError, dataLabApi } from "./api";
import { useAuth } from "./auth-provider";
import { BackLink } from "./back-link";
import { CharacterPalette } from "./character-palette";
import { fieldClasses, primaryButton, quietButton, secondaryButton } from "./styles";
import type { Language, RejectReason, ReviewItem } from "./types";

const textReasons: { value: RejectReason; label: string }[] = [
  { value: "inaccurate", label: "Meaning is wrong" },
  { value: "incomplete", label: "Something is missing" },
  { value: "machine_translated", label: "Reads as machine-translated" },
  { value: "off_topic", label: "Doesn't answer the prompt" },
  { value: "other", label: "Other" },
];

const recordingReasons: { value: RejectReason; label: string }[] = [
  { value: "inaccurate", label: "Doesn't match the text" },
  { value: "incomplete", label: "Cut off or incomplete" },
  { value: "unclear", label: "Hard to hear" },
  { value: "other", label: "Other" },
];

const signReasons: { value: RejectReason; label: string }[] = [
  { value: "inaccurate", label: "Different meaning" },
  { value: "incomplete", label: "Cut off or incomplete" },
  { value: "unclear", label: "Hard to see" },
  { value: "other", label: "Other" },
];

const reasonsFor = { text: textReasons, audio: recordingReasons, video: signReasons } as const;

const categoryLabel = (id: string) => civicCategories.find((c) => c.id === id)?.label ?? id;

type View =
  | { status: "loading" }
  | { status: "item"; item: ReviewItem }
  | { status: "empty" }
  | { status: "blocked"; message: string };

function Review({ language }: { language: string }) {
  const { user, getToken } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [view, setView] = useState<View>({ status: "loading" });
  // Reviewing: accept, or open one of the two other decisions.
  const [mode, setMode] = useState<"review" | "reject" | "correct">("review");
  const [corrected, setCorrected] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const target = languages.find((l) => l.code === language);
  const nameOf = (code: string) => languages.find((l) => l.code === code)?.name ?? code;

  useEffect(() => {
    dataLabApi.languages().then(setLanguages, () => setLanguages([]));
  }, []);

  const fetchItem = useCallback(async (): Promise<View> => {
    try {
      return { status: "item", item: await dataLabApi.nextReview(await getToken(), language) };
    } catch (err) {
      if (err instanceof ApiError && err.code === "no_reviews") return { status: "empty" };
      return { status: "blocked", message: err instanceof Error ? err.message : "Something went wrong." };
    }
  }, [getToken, language]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchItem().then((next) => !cancelled && setView(next));
    return () => {
      cancelled = true;
    };
  }, [user, fetchItem]);

  const decide = async (item: ReviewItem, decision: "accept" | "correct" | "reject") => {
    setBusy(true);
    try {
      await dataLabApi.review(await getToken(), {
        contribution_id: item.contribution_id,
        decision,
        ...(decision === "reject" && { reason: reason ?? undefined, note }),
        ...(decision === "correct" && { corrected_text: corrected }),
      });
      setReviewed((n) => n + 1);
    } catch (err) {
      // Someone else reviewed it first: move on rather than stopping the reviewer.
      if (!(err instanceof ApiError && err.code === "already_reviewed")) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
        setBusy(false);
        return;
      }
    }
    setMode("review");
    setReason(null);
    setNote("");
    setCorrected("");
    setBusy(false);
    setView({ status: "loading" });
    setView(await fetchItem());
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <BackLink href="/data-lab/workspace" label="Workspace" className="self-start" />
          <h1 className="text-h2">Review · {target?.native_name ?? language}</h1>
        </div>
        {reviewed > 0 && <span className="font-mono text-xs text-subtle">{reviewed} reviewed this session</span>}
      </div>

      {view.status === "loading" && <p className="font-mono text-xs text-faint">Loading the next contribution…</p>}

      {view.status === "empty" && (
        <FramedCard panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
          <p className="text-lg">Nothing is waiting for review in {target?.name ?? language}.</p>
          <p className="pt-2 text-sm text-subtle">New contributions appear here as volunteers submit them.</p>
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

      {view.status === "item" && (
        <FramedCard panelsClassName="flex flex-col bg-[#0b0a07]">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col gap-5 bg-[#1c1a0e] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Eyebrow>
                  {view.item.kind === "write"
                    ? `Prompt · ${nameOf(view.item.item_language)}`
                    : view.item.kind === "word"
                      ? `Word · ${nameOf(view.item.item_language)}`
                      : `Original · ${nameOf(view.item.item_language)}`}
                </Eyebrow>
                <span className="font-mono text-xs text-faint">{categoryLabel(view.item.category)}</span>
              </div>
              <p lang={view.item.item_language} className="text-xl leading-snug text-pretty">
                {view.item.item_text}
              </p>
            </div>
            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Eyebrow>
                  {view.item.modality === "video"
                    ? "Sign"
                    : view.item.modality === "audio"
                      ? "Recording"
                      : view.item.kind === "translate"
                        ? "Translation"
                        : "Answer"}{" "}
                  · {target?.name ?? language}
                </Eyebrow>
                {view.item.pasted && (
                  <span className="inline-flex h-6 items-center rounded-full border border-line-strong px-2.5 font-mono text-[11px] leading-none text-subtle">
                    Pasted in
                  </span>
                )}
              </div>
              {view.item.modality === "video" ? (
                <>
                  <p className="text-sm text-subtle">
                    Watch, and check it signs the {view.item.kind === "word" ? "word" : "sentence"} clearly, as a
                    signer of {target?.name ?? language} would.
                  </p>
                  {view.item.video_url ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={view.item.video_url}
                      className="aspect-video w-full rounded-inset border border-line bg-background object-contain"
                    />
                  ) : (
                    <p className="font-mono text-xs text-faint">The video can&apos;t be played right now.</p>
                  )}
                </>
              ) : view.item.modality === "audio" ? (
                <>
                  <p lang={language} className="text-xl leading-snug text-pretty whitespace-pre-line">
                    {view.item.read_text}
                  </p>
                  <p className="text-sm text-subtle">Listen, and check the recording says exactly this, clearly.</p>
                  {view.item.audio_url ? (
                    <audio controls preload="metadata" src={view.item.audio_url} className="h-10 w-full" />
                  ) : (
                    <p className="font-mono text-xs text-faint">The recording can&apos;t be played right now.</p>
                  )}
                </>
              ) : mode === "correct" ? (
                <>
                  <textarea
                    ref={editor}
                    lang={language}
                    value={corrected}
                    onChange={(e) => setCorrected(e.target.value.slice(0, 2000))}
                    rows={5}
                    autoFocus
                    aria-label={`Corrected text in ${target?.name ?? language}`}
                    className="min-h-36 w-full resize-none rounded-inset border border-signal/60 bg-background p-3 text-xl leading-snug text-foreground outline-none focus:border-signal"
                  />
                  <CharacterPalette
                    characters={target?.extra_characters ?? []}
                    editor={editor}
                    value={corrected}
                    onChange={setCorrected}
                  />
                </>
              ) : (
                <p lang={language} className="text-xl leading-snug text-pretty whitespace-pre-line">
                  {view.item.text}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 border-t border-line p-6 sm:p-8">
            {mode === "reject" && (
              <fieldset className="flex flex-col gap-4">
                <legend className="pb-3 font-mono text-xs text-faint">Why isn&apos;t it ready?</legend>
                <div className="flex flex-wrap gap-2">
                  {reasonsFor[view.item.modality].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      aria-pressed={reason === r.value}
                      onClick={() => setReason(r.value)}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-1.5 font-mono text-xs transition-colors",
                        reason === r.value
                          ? "border-signal bg-signal text-background"
                          : "border-line-strong text-subtle hover:border-signal hover:text-signal",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <label className="flex max-w-xl flex-col gap-1.5">
                  <span className="font-mono text-xs text-faint">Note for the contributor (optional)</span>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={cn(fieldClasses, "resize-none")}
                  />
                </label>
              </fieldset>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {mode === "reject" && (
                <>
                  <button type="button" onClick={() => setMode("review")} disabled={busy} className={quietButton}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(view.item, "reject")}
                    disabled={busy || !reason}
                    className={secondaryButton}
                  >
                    Reject
                  </button>
                </>
              )}
              {mode === "correct" && (
                <>
                  <button type="button" onClick={() => setMode("review")} disabled={busy} className={quietButton}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(view.item, "correct")}
                    disabled={busy || !corrected.trim() || corrected.trim() === view.item.text.trim()}
                    className={cn(primaryButton, "min-w-32")}
                  >
                    Save correction
                  </button>
                </>
              )}
              {mode === "review" && (
                <>
                  <button type="button" onClick={() => setMode("reject")} disabled={busy} className={secondaryButton}>
                    Needs changes
                  </button>
                  {view.item.modality === "text" && (
                    <button
                      type="button"
                      onClick={() => {
                        setCorrected(view.item.text);
                        setMode("correct");
                      }}
                      disabled={busy}
                      className={secondaryButton}
                    >
                      Correct
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => decide(view.item, "accept")}
                    disabled={busy}
                    className={cn(primaryButton, "min-w-32")}
                  >
                    Accept
                  </button>
                </>
              )}
            </div>
          </div>
        </FramedCard>
      )}
    </div>
  );
}

export { Review };
