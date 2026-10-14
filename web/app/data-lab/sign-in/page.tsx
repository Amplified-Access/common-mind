import type { Metadata } from "next";
import Link from "next/link";

import { SignInPage } from "@/components/data-lab/sign-in-page";
import { safeNext } from "@/components/data-lab/sign-in-route";

export const metadata: Metadata = {
  title: "Sign in · Data Lab",
};

export default async function DataLabSignInPage({ searchParams }: PageProps<"/data-lab/sign-in">) {
  const { next } = await searchParams;
  return (
    // A standalone page (see standalonePaths): no header or footer, the form
    // centered on the screen, and a way back in the top-left corner. The
    // full-screen box stays unzoomed so it matches the real viewport; only
    // its contents take the site's zoom-viewport scaling.
    <div className="relative flex min-h-svh items-center justify-center">
      <div className="zoom-viewport absolute top-0 left-0 px-4 pt-6 md:px-8 xl:px-12">
        <Link href="/data-lab" className="font-mono text-xs text-signal hover:text-foreground">
          ← Data Lab
        </Link>
      </div>
      <div className="zoom-viewport w-full px-4 py-20 md:px-8">
        <SignInPage next={safeNext(next)} />
      </div>
    </div>
  );
}
