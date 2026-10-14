"use client";

import { FirebaseError } from "firebase/app";
import { useState } from "react";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";
import { fieldClasses, primaryButton, secondaryButton } from "./styles";

const messages: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match an account.",
  "auth/email-already-in-use": "An account with that email already exists. Sign in instead.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
};

function SignIn() {
  const { configured, signInWithGoogle, signInWithEmail } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(messages[code] ?? "Sign-in didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <FramedCard panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
        <p className="text-sm text-subtle">
          Sign-in isn&apos;t configured here. Set the <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          variables from <code className="font-mono">web/.env.example</code>.
        </p>
      </FramedCard>
    );
  }

  return (
    <FramedCard panelsClassName="bg-[#1c1a0e] p-6 sm:p-8">
      <div className="flex max-w-md flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>{mode === "create" ? "Create an account" : "Sign in"}</Eyebrow>
          <h2 className="text-h3">Join the Data Lab</h2>
          <p className="text-sm text-subtle">
            Contribute in the languages you speak. Your account keeps your languages, your work, and your reviews in one
            place.
          </p>
        </div>

        <button type="button" disabled={busy} onClick={() => run(signInWithGoogle)} className={secondaryButton}>
          Continue with Google
        </button>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => signInWithEmail(email, password, mode === "create"));
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs text-faint">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClasses}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs text-faint">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClasses}
            />
          </label>
          <button type="submit" disabled={busy} className={primaryButton}>
            {mode === "create" ? "Create account" : "Sign in"}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "create" ? "sign-in" : "create")}
          className="cursor-pointer self-start font-mono text-xs text-signal hover:text-foreground"
        >
          {mode === "create" ? "I already have an account" : "Create an account with email"}
        </button>
      </div>
    </FramedCard>
  );
}

export { SignIn };
