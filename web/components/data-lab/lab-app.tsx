"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { Container } from "@/components/common/container";

import { useAuth } from "./auth-provider";
import { signInHref } from "./sign-in-route";
import { quietButton } from "./styles";
import type { Volunteer } from "./types";
import { useVolunteer, type VolunteerState } from "./use-volunteer";

const WELCOME = "/data-lab/welcome";

type LabContext = { state: VolunteerState; refresh: () => Promise<void> };

const VolunteerContext = createContext<LabContext | null>(null);

/** The signed-in volunteer's profile, shared by every page in the Data Lab app. */
function useLab(): LabContext {
  const ctx = useContext(VolunteerContext);
  if (!ctx) throw new Error("useLab must be used inside <LabApp>");
  return ctx;
}

/** The ready volunteer; LabApp only renders workspace pages once there is one. */
function useVolunteerReady(): Volunteer {
  const { state } = useLab();
  if (state.status !== "ready") throw new Error("useVolunteerReady needs a ready volunteer");
  return state.volunteer;
}

/**
 * The Data Lab app: workspace, welcome, contribute, and review. It replaces
 * the site's header and footer with its own bar, sends signed-out visitors to
 * sign in, and sends volunteers who haven't joined, or who owe the current
 * consent, to the welcome page first.
 */
function LabApp({ children }: { children: React.ReactNode }) {
  const { state, refresh } = useVolunteer();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Signing out leaves for the public page; the guard must not send the
  // now signed-out visitor to sign in on the way.
  const [leaving, setLeaving] = useState(false);
  const onWelcome = pathname === WELCOME;
  const needsWelcome = state.status === "onboarding" || (state.status === "ready" && !state.consentCurrent);

  useEffect(() => {
    if (state.status === "signed-out" && !leaving) router.replace(signInHref(pathname));
    else if (needsWelcome && !onWelcome) router.replace(WELCOME);
  }, [state.status, needsWelcome, onWelcome, pathname, router, leaving]);

  const canRender = onWelcome
    ? state.status === "onboarding" || state.status === "ready"
    : state.status === "ready" && !needsWelcome;

  return (
    <VolunteerContext.Provider value={{ state, refresh }}>
      {/* A page marked data-fullscreen fills the screen below the bar,
          without scrolling, from tablet width up. */}
      <div className="flex min-h-svh flex-col md:has-[[data-fullscreen]]:h-svh">
        <LabBar
          volunteer={state.status === "ready" ? state.volunteer : undefined}
          signedIn={state.status !== "signed-out" && state.status !== "loading"}
          onSignOut={async () => {
            setLeaving(true);
            await signOut();
            router.push("/data-lab");
          }}
        />
        <main className="zoom-viewport flex-1 py-10 sm:py-14 md:has-[[data-fullscreen]]:flex md:has-[[data-fullscreen]]:min-h-0 md:has-[[data-fullscreen]]:flex-col md:has-[[data-fullscreen]]:py-5">
          <Container className="md:has-[[data-fullscreen]]:flex md:has-[[data-fullscreen]]:min-h-0 md:has-[[data-fullscreen]]:max-w-none md:has-[[data-fullscreen]]:flex-1 md:has-[[data-fullscreen]]:flex-col">
            {state.status === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            )}
            {canRender ? children : state.status !== "error" && <p className="font-mono text-xs text-faint">Loading…</p>}
          </Container>
        </main>
      </div>
    </VolunteerContext.Provider>
  );
}

function LabBar({
  volunteer,
  signedIn,
  onSignOut,
}: {
  volunteer?: Volunteer;
  signedIn: boolean;
  onSignOut: () => void;
}) {
  return (
    <header className="zoom-viewport border-b border-line">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/data-lab" className="flex items-center gap-3" aria-label="Data Lab">
          <Image src="/logo-white.svg" alt="CommonMind" width={225} height={37} priority className="h-6 w-auto" />
          <span className="font-mono text-xs text-signal">Data Lab</span>
        </Link>
        {signedIn && (
          <div className="flex items-center gap-1">
            {volunteer && <span className="hidden font-mono text-xs text-subtle sm:inline">{volunteer.name}</span>}
            <button
              type="button"
              onClick={onSignOut}
              className={quietButton}
            >
              Sign out
            </button>
          </div>
        )}
      </Container>
    </header>
  );
}

export { LabApp, useLab, useVolunteerReady };
