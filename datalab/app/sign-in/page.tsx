import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";
import { SignInPage } from "@/components/sign-in-page";
import { safeNext } from "@/components/sign-in-route";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Sign in · Data Lab",
};

export default async function DataLabSignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  return (
    <div className="relative flex min-h-svh items-center justify-center">
      {/* Out of the flow, so they never shift the form's centering. */}
      <BackLink href="/" label="Back" className="absolute top-7 left-4 md:left-8" />
      <ThemeToggle className="absolute top-4 right-4 md:right-8" />
      <div className="w-full px-4 py-20 md:px-8">
        <SignInPage next={safeNext(next)} />
      </div>
    </div>
  );
}
