"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./auth-provider";
import { primaryButton } from "./styles";
import { ThemeToggle } from "./theme-toggle";

/** The front door: what the Data Lab is for and a way in. Signed-in volunteers go to their workspace. */
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
        <div className="flex max-w-xl flex-col items-start gap-6">
          <h1 className="text-h2 font-semibold tracking-tight">Help your language be better understood.</h1>
          <p className="text-subtle">
            The way we speak and write carries meaning that technology doesn&apos;t always understand. By sharing
            written text and translations, you can help us build better language tools for everyone.
          </p>
          <p className="text-subtle">Every contribution makes a difference.</p>
          <Link href="/sign-in" className={primaryButton}>
            Start contributing →
          </Link>
        </div>
      )}
    </main>
  );
}

export { Home };
