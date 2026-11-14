import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { cn } from "@/lib/utils";

import { quietButton } from "../styles";
import { signOutOfAdmin } from "./actions";
import type { AdminFailure } from "./api";
import { ADMIN_PATH } from "./session";

/** The admin's frame: its own bar in place of the site's header and footer. */
function AdminShell({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="zoom-viewport border-b border-line">
        <Container size="lg" className="flex h-14 items-center justify-between gap-4">
          <Link href={ADMIN_PATH} className="flex items-center gap-3" aria-label="Data Lab admin">
            <Image src="/logo-white.svg" alt="CommonMind" width={225} height={37} priority className="h-6 w-auto" />
            <span className="font-mono text-xs whitespace-nowrap text-signal">
              <span className="hidden sm:inline">Data Lab · </span>Admin
            </span>
          </Link>
          {signedIn && (
            <form action={signOutOfAdmin}>
              <button type="submit" className={cn(quietButton, "px-3 whitespace-nowrap")}>
                Sign out
              </button>
            </form>
          )}
        </Container>
      </header>
      <main className="zoom-viewport flex-1 py-10 sm:py-14">
        <Container size="lg">{children}</Container>
      </main>
    </div>
  );
}

const failureMessage: Record<Exclude<AdminFailure["status"], "unauthorized" | "not_found">, string> = {
  locked: "Too many wrong passwords were tried. Wait a minute, then reload.",
  unavailable: "The Data Lab can't be reached right now, or its admin is switched off. Try again in a moment.",
};

/** Why a page has nothing to show. */
function AdminNotice({ status }: { status: keyof typeof failureMessage }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {failureMessage[status]}
    </p>
  );
}

export { AdminNotice, AdminShell };
