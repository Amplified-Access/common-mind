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
    // centered on the screen, and a way back in the top-left corner.
    <div className="zoom-viewport relative flex min-h-svh items-center justify-center px-4 py-20 md:px-8">
      <Link
        href="/data-lab"
        className="absolute top-6 left-4 font-mono text-xs text-signal hover:text-foreground md:left-8 xl:left-12"
      >
        ← Data Lab
      </Link>
      <div className="w-full">
        <SignInPage next={safeNext(next)} />
      </div>
    </div>
  );
}
