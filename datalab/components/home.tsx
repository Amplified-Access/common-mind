"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./auth-provider";
import { primaryButton } from "./styles";
import { ThemeToggle } from "./theme-toggle";

/** The front door: one Sign in button. Signed-in volunteers go to their workspace. */
function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/workspace");
  }, [user, router]);

  return (
    <main className="relative flex min-h-svh items-center justify-center p-4">
      <ThemeToggle className="absolute top-4 right-4 md:right-8" />
      {!loading && !user && (
        <Link href="/sign-in" className={primaryButton}>
          Sign in
        </Link>
      )}
    </main>
  );
}

export { Home };
