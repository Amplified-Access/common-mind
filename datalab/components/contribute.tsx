"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Eyebrow, FramedCard } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

import { ApiError, dataLabApi, uploadRecording } from "./api";
import { useAuth } from "./auth-provider";
import { BackLink } from "./back-link";
import { CharacterPalette } from "./character-palette";
import { voiceConsentPoints } from "./consent";
import { primaryButton, quietButton } from "./styles";
import type { Language, Modality, Task } from "./types";
import { useVolunteer } from "./use-volunteer";
import { canRecordAudio, type Recording, VoiceRecorder } from "./voice-recorder";

const MAX_CHARS = 2000;

// Writing and speaking share one form height, so switching between them (or
// loading the next task) doesn't move the page. The text box takes whatever
// the form doesn't need.
const FORM_HEIGHT = "h-104";

type View =
  | { status: "loading" }
  | { status: "task"; task: Task }
  | { status: "empty" }
  | { status: "blocked"; message: string };

function Contribute({ language }: { language: string }) {
  const { user, getToken } = useAuth();
  const { state: volunteer, refresh: refreshVolunteer } = useVolunteer();
  const [languages, setLanguages] = useState<Language[]>([]);
  // Speaking is offered when the server stores recordings and the browser can record.
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [modality, setModality] = useState<Modality>("text");
  const [view, setView] = useState<View>({ status: "loading" });
  const [text, setText] = useState("");
  const [pasted, setPasted] = useState(false);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const editor = useRef<HTMLTextAreaElement>(null);

  const target = languages.find((l) => l.code === language);
  const nameOf = (code: string) => languages.find((l) => l.code === code)?.name ?? code;
  const voiceConsent = volunteer.status === "ready" && volunteer.volunteer.voice_consent;
  // Speaking needs the voice consent first; until then the consent shows instead of a task.
  const askingConsent = modality === "audio" && volunteer.status === "ready" && !voiceConsent;
  // Whether speaking is allowed isn't known until the profile loads.
  const awaitingProfile = modality === "audio" && volunteer.status === "loading";

  useEffect(() => {
    dataLabApi.languages().then(setLanguages, () => setLanguages([]));
    dataLabApi.features().then(
      ({ voice }) => setVoiceAvailable(voice && canRecordAudio()),
      () => setVoiceAvailable(false),
    );
  }, []);

  const fetchTask = useCallback(async (): Promise<View> => {
    try {
      return { status: "task", task: await dataLabApi.nextTask(await getToken(), language, modality) };
    } catch (err) {
      if (err instanceof ApiError && err.code === "no_tasks") return { status: "empty" };
      return { status: "blocked", message: err instanceof Error ? err.message : "Something went wrong." };
    }
  }, [getToken, language, modality]);

  useEffect(() => {
    if (!user || askingConsent || awaitingProfile) return;
    let cancelled = false;
    fetchTask().then((next) => !cancelled && setView(next));
    return () => {
      cancelled = true;
    };
  }, [user, fetchTask, askingConsent, awaitingProfile]);

  const reset = () => {
    setText("");
    setPasted(false);
    setRecording(null);
  };

  const switchTo = (next: Modality) => {
    if (next === modality) return;
    reset();
    setView({ status: "loading" });
    setModality(next);
  };

  const next = async () => {
    reset();
    setView({ status: "loading" });
    setView(await fetchTask());
  };

  const acceptVoiceConsent = async () => {
    setBusy(true);
    try {
      await dataLabApi.acceptVoiceConsent(await getToken());
      await refreshVolunteer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (task: Task) => {
    setBusy(true);
    try {
      const token = await getToken();
      if (modality === "audio") {
        if (!recording) return;
        // The recording goes straight to storage; the contribution names it.
        const upload = await dataLabApi.startRecording(token, {
          item_id: task.item_id,
          language,
          content_type: recording.type,
        });
        await uploadRecording(upload, recording.blob);
        await dataLabApi.contribute(token, {
          item_id: task.item_id,
          language,
          modality,
          text: "",
          audio_key: upload.key,
          pasted: false,
        });
      } else {
        await dataLabApi.contribute(token, { item_id: task.item_id, language, modality, text, pasted });
      }
      setSubmitted((n) => n + 1);
      await next();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const ready = modality === "audio" ? !!recording : !!text.trim();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <BackLink href="/workspace" label="Workspace" className="self-start" />
          <h1 className="text-h2">{target?.native_name ?? language}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {submitted > 0 && (
            <span className="font-mono text-xs text-subtle">{submitted} submitted for review this session</span>
          )}
          {voiceAvailable && (
            <Segmented
              label="Write or speak"
              value={modality}
              onChange={(id) => switchTo(id as Modality)}
              items={[
                { id: "text", label: "Write" },
                { id: "audio", label: "Speak" },
              ]}
            />
          )}
        </div>
      </div>

      {askingConsent ? (
        <FramedCard panelsClassName="flex flex-col gap-6 bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <Eyebrow>Before you record</Eyebrow>
            <p className="text-lg">Recording your voice adds to what you agreed to when you joined.</p>
          </div>
          <ul className="flex max-w-2xl flex-col gap-3 text-sm text-subtle">
            {voiceConsentPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground" />
                {point}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={acceptVoiceConsent} disabled={busy} className={primaryButton}>
              I agree, start recording
            </button>
            <button type="button" onClick={() => switchTo("text")} disabled={busy} className={quietButton}>
              Keep writing
            </button>
          </div>
        </FramedCard>
      ) : (
        <>
          {view.status === "loading" && (
            <p className={cn("flex items-center font-mono text-xs text-faint", FORM_HEIGHT)}>
              Loading the next task…
            </p>
          )}

          {view.status === "empty" && (
            <FramedCard panelsClassName="bg-surface p-6 sm:p-8">
              {modality === "audio" ? (
                <>
                  <p className="text-lg">
                    No verified translations in {target?.name ?? language} are waiting to be recorded.
                  </p>
                  <p className="pt-2 text-sm text-subtle">
                    Recording opens as translations are verified. Write some meanwhile, or check back soon.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg">You&apos;ve done every task in {target?.name ?? language} for now.</p>
                  <p className="pt-2 text-sm text-subtle">New items are added regularly. Check back soon.</p>
                </>
              )}
            </FramedCard>
          )}

          {view.status === "blocked" && (
            <FramedCard panelsClassName="flex flex-col items-start gap-4 bg-surface p-6 sm:p-8">
              <p className="text-lg">{view.message}</p>
              <Link href="/workspace" className={primaryButton}>
                Back to your workspace
              </Link>
            </FramedCard>
          )}

          {view.status === "task" && (
            <FramedCard panelsClassName="grid bg-background md:grid-cols-2">
              <div className="flex flex-col gap-5 bg-surface p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Eyebrow>
                    {modality === "audio"
                      ? `Read aloud in ${target?.name ?? language}`
                      : view.task.kind === "translate"
                        ? `Translate from ${nameOf(view.task.text_language)}`
                        : `Write in ${target?.name ?? language}`}
                  </Eyebrow>
                  <span className="font-mono text-xs text-faint">{categoryLabel(view.task.category)}</span>
                </div>
                <p lang={view.task.text_language} className="text-2xl leading-snug text-pretty">
                  {view.task.text}
                </p>
                <p className="mt-auto text-sm text-subtle">
                  {modality === "audio"
                    ? "A verified translation. Read it exactly as written, clearly and at a natural pace."
                    : view.task.kind === "write" && "Answer in your own words, as you would say it to a neighbour."}
                </p>
              </div>

              <form
                className={cn("relative flex flex-col gap-4 p-6 sm:p-8", FORM_HEIGHT)}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(view.task);
                }}
              >
                {modality === "audio" ? (
                  <>
                    {/* Centred on the whole panel, footer included, so the space
                        above and below it balances; clicks pass through the
                        layer to the buttons. */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 sm:p-8">
                      <div className="pointer-events-auto w-full">
                        <VoiceRecorder recording={recording} onChange={setRecording} disabled={busy} />
                      </div>
                    </div>
                    <div className="flex-1" />
                  </>
                ) : (
                  <>
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
                      className="min-h-0 w-full flex-1 resize-none bg-transparent text-xl leading-snug text-foreground outline-none placeholder:text-foreground/25"
                    />
                    <CharacterPalette
                      characters={target?.extra_characters ?? []}
                      editor={editor}
                      value={text}
                      onChange={setText}
                    />
                  </>
                )}
                <div className="relative flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={next} disabled={busy} className={quietButton}>
                    Skip
                  </button>
                  <button type="submit" disabled={busy || !ready} className={cn(primaryButton, "min-w-32")}>
                    {busy ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </form>
            </FramedCard>
          )}
        </>
      )}
    </div>
  );
}

export { Contribute };
