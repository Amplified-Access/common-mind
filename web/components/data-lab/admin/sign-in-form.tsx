"use client";

import { useActionState } from "react";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";

import { fieldClasses, primaryButton } from "../styles";
import { signInToAdmin, type SignInState } from "./actions";

/** The admin's password form; `notice` explains why they're asked again. */
function AdminSignInForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInToAdmin, { error: null });
  const message = state.error ?? notice;

  return (
    <FramedCard className="mx-auto w-full max-w-md" panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
      <form action={action} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>Admin</Eyebrow>
          <h1 className="text-h3">Data Lab admin</h1>
          <p className="text-sm text-subtle">Enter the team password to see each volunteer&apos;s translations.</p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs text-faint">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
            className={fieldClasses}
          />
        </label>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </FramedCard>
  );
}

export { AdminSignInForm };
