"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FirebaseError } from "firebase/app";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useAuth } from "./auth-provider";
import { fieldClasses, primaryButton, secondaryButton } from "./styles";

const messages: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match an account.",
  "auth/email-already-in-use": "An account with that email already exists. Sign in instead.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  // The Firebase project hasn't enabled Authentication, or this sign-in method.
  "auth/configuration-not-found": "Sign-in isn't available yet. Please try again later.",
  "auth/operation-not-allowed": "This sign-in method isn't available yet. Try another one.",
};

function SignIn() {
  const { configured, signInWithGoogle, signInWithEmail } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      toast.error(messages[code] ?? "Sign-in didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <Card className="mx-auto w-full max-w-md bg-surface p-6 sm:p-8">
        <p className="text-sm text-subtle">
          Sign-in isn&apos;t configured here. Set the <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          variables from <code className="font-mono">datalab/.env.example</code>.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-h3">{mode === "create" ? "Create an account" : "Sign in"}</h1>

        <button type="button" disabled={busy} onClick={() => run(signInWithGoogle)} className={secondaryButton}>
          Continue with Google
        </button>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "create" && password !== repeat) {
              toast.error("The passwords don't match. Type the same password in both fields.");
              return;
            }
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
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
          />
          {mode === "create" && (
            <PasswordField label="Repeat password" value={repeat} onChange={setRepeat} autoComplete="new-password" />
          )}
          <button type="submit" disabled={busy} className={primaryButton}>
            {mode === "create" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "create" ? "sign-in" : "create");
            setRepeat("");
          }}
          className="cursor-pointer self-start font-mono text-xs text-subtle hover:text-foreground"
        >
          {mode === "create" ? "I already have an account" : "Create an account with email"}
        </button>
      </div>
    </Card>
  );
}

// A password input with a button that shows or hides what's typed.
function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs text-faint">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClasses, "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-faint transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={visible ? ViewOffSlashIcon : ViewIcon} strokeWidth={1.5} className="size-4.5" />
        </button>
      </div>
    </div>
  );
}

export { SignIn };
