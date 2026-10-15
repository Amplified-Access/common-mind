"use client";

import { LinkButton } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";

/** The Data Lab hero's call to action: Sign in, or Open workspace once signed in. */
function HeroAction({ signIn, openWorkspace }: { signIn: string; openWorkspace: string }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <div>
      {user ? (
        <LinkButton href="/data-lab/workspace">{openWorkspace}</LinkButton>
      ) : (
        <LinkButton href="/data-lab/sign-in">{signIn}</LinkButton>
      )}
    </div>
  );
}

export { HeroAction };
