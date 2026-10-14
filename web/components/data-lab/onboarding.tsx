"use client";

import Link from "next/link";
import { useState } from "react";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";
import { cn } from "@/lib/utils";

import { dataLabApi } from "./api";
import { useAuth } from "./auth-provider";
import { CONSENT_VERSION, consentPoints } from "./consent";
import { fieldClasses, primaryButton } from "./styles";
import type { Language, Volunteer } from "./types";

type OnboardingProps = {
  languages: Language[];
  /** Present when an existing volunteer adds languages or accepts new consent. */
  volunteer?: Volunteer;
  onDone: () => void;
};

function Onboarding({ languages, volunteer, onDone }: OnboardingProps) {
  const { user, getToken } = useAuth();
  const joined = new Set(volunteer?.languages.map((m) => m.language_code));
  const [name, setName] = useState(volunteer?.name ?? user?.displayName ?? "");
  const [chosen, setChosen] = useState<Set<string>>(new Set(joined));
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (code: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await dataLabApi.onboard(await getToken(), {
        name,
        languages: [...chosen],
        consent_version: CONSENT_VERSION,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <FramedCard panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
      <form onSubmit={submit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Eyebrow>{volunteer ? "Your languages" : "Welcome"}</Eyebrow>
          <h2 className="text-h3">{volunteer ? "Choose your languages" : "Set up your profile"}</h2>
        </div>

        <label className="flex max-w-sm flex-col gap-1.5">
          <span className="font-mono text-xs text-faint">Your name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClasses} />
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="pb-3 font-mono text-xs text-faint">Languages you speak well enough to translate into</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {languages.map((l) => {
              const selected = chosen.has(l.code);
              const locked = joined.has(l.code);
              return (
                <label
                  key={l.code}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-inset border px-4 py-3 transition-colors",
                    selected ? "border-signal bg-signal/5" : "border-line hover:border-line-strong",
                    locked && "cursor-default",
                  )}
                >
                  <span className="flex flex-col">
                    <span className="text-sm">{l.native_name}</span>
                    <span className="font-mono text-[11px] text-faint">{l.name}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={locked}
                    onChange={() => toggle(l.code)}
                    className="size-4 accent-[#ffd300]"
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 rounded-inset border border-line bg-background p-5">
          <span className="font-mono text-xs text-signal">How your contributions are used</span>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-subtle">
            {consentPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4 accent-[#ffd300]"
            />
            <span>
              I agree to contribute on these terms and the{" "}
              <Link href="/terms" className="text-signal hover:text-foreground">
                terms of use
              </Link>
              .
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy || chosen.size === 0 || !agreed} className={cn(primaryButton, "self-start")}>
          {volunteer ? "Save" : "Join the Data Lab"}
        </button>
      </form>
    </FramedCard>
  );
}

export { Onboarding };
