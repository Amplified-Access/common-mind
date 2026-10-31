import type { Metadata } from "next";

import { BackLink } from "@/components/data-lab/back-link";
import { SignInPage } from "@/components/data-lab/sign-in-page";
import { safeNext } from "@/components/data-lab/sign-in-route";

export const metadata: Metadata = {
  title: "Sign in | Data Lab",
  alternates: { canonical: "/data-lab/sign-in" },
};

export default async function DataLabSignInPage({ searchParams }: PageProps<"/data-lab/sign-in">) {
  const { next } = await searchParams;
  return (
    // A standalone page (see standalonePaths): no header or footer, the form
    // centered on the screen, and a way back in the top-left corner. The
    // full-screen box stays unzoomed so it matches the real viewport; only
    // its contents take the site's zoom-viewport scaling.
    <div className="relative flex min-h-svh items-center justify-center">
      {/* Out of the flow, so it never shifts the form's centering. */}
      <div className="zoom-viewport absolute top-0 left-0 px-4 pt-6 md:px-8 xl:px-12">
        <BackLink />
      </div>
      {/* Padding only clears the back link: on phones the card sits under it;
          from md up they never overlap. More would make the zoomed card
          outgrow short windows and scroll. */}
      <div className="zoom-viewport w-full px-4 py-16 md:px-8 md:py-6">
        <SignInPage next={safeNext(next)} />
      </div>
    </div>
  );
}
