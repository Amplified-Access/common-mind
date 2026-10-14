"use client";

import { LinkButton } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";

/** The Data Lab hero's call to action: Sign in, or Open workspace once signed in. */
function HeroAction() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <div>
      {user ? (
        <LinkButton href="/data-lab/workspace">Open workspace</LinkButton>
      ) : (
        <LinkButton href="/data-lab/sign-in">Sign in</LinkButton>
      )}
    </div>
  );
}

export { HeroAction };
