"use client";

import { useAuth } from "./auth-provider";
import { SignIn } from "./sign-in";

/** The sign-in form for the Data Lab hero, shown only to signed-out visitors. */
function HeroSignIn() {
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return <SignIn />;
}

export { HeroSignIn };
