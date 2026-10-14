"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signInHref } from "./sign-in-route";

/** Sends a signed-out visitor to the sign-in page, to return to `next`. */
function RedirectToSignIn({ next }: { next: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(signInHref(next));
  }, [next, router]);
  return null;
}

export { RedirectToSignIn };
