"use client";

import { LinkButton } from "@/components/system/primitives";

import { useAuth } from "./auth-provider";

/** A Sign in button for signed-out visitors; nothing once signed in. */
function SignInLink() {
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return (
    <div>
      <LinkButton href="/data-lab/sign-in">Sign in</LinkButton>
    </div>
  );
}

export { SignInLink };
