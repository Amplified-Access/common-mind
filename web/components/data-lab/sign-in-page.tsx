"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./auth-provider";
import { SignIn } from "./sign-in";

/** The sign-in form on its own page; signed-in visitors go on to `next`. */
function SignInPage({ next }: { next: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  if (loading || user) return null;
  return <SignIn />;
}

export { SignInPage };
