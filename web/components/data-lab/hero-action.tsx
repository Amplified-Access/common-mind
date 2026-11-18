"use client";

import { LinkButton } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";

/** The Data Lab hero's call to action: Sign in, or Open workspace once signed in. */
function HeroAction({ signIn, openWorkspace }: { signIn: string; openWorkspace: string }) {
  const { user, loading } = useAuth();
  // While sign-in is checked, a pulsing button holds the place, so a newcomer
  // sees that an action is on its way.
  if (loading) {
    return (
      <div role="status" aria-label="Loading">
        <span className="inline-block h-8 w-36 chamfer bg-signal/25 motion-safe:animate-pulse" />
      </div>
    );
  }
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
