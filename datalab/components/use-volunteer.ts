"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, dataLabApi } from "./api";
import { useAuth } from "./auth-provider";
import { CONSENT_VERSION } from "./consent";
import type { Volunteer } from "./types";

type VolunteerState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "onboarding" } // signed in, hasn't joined yet
  | { status: "ready"; volunteer: Volunteer; consentCurrent: boolean }
  | { status: "error"; message: string };

// The profile as last loaded, tagged with whose it is so a stale one is never shown.
type Loaded = { uid: string; state: VolunteerState };

async function loadVolunteer(getToken: () => Promise<string>): Promise<VolunteerState> {
  try {
    const volunteer = await dataLabApi.me(await getToken());
    return { status: "ready", volunteer, consentCurrent: volunteer.consent_version === CONSENT_VERSION };
  } catch (err) {
    if (err instanceof ApiError && err.code === "onboarding_required") return { status: "onboarding" };
    return { status: "error", message: err instanceof Error ? err.message : "Something went wrong." };
  }
}

/** The signed-in volunteer's Data Lab profile, reloaded with `refresh`. */
function useVolunteer() {
  const { user, loading, getToken } = useAuth();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    loadVolunteer(getToken).then((state) => !cancelled && setLoaded({ uid, state }));
    return () => {
      cancelled = true;
    };
  }, [uid, getToken]);

  const refresh = useCallback(async () => {
    if (uid) setLoaded({ uid, state: await loadVolunteer(getToken) });
  }, [uid, getToken]);

  let state: VolunteerState;
  if (loading) state = { status: "loading" };
  else if (!uid) state = { status: "signed-out" };
  else state = loaded?.uid === uid ? loaded.state : { status: "loading" };

  return { state, refresh };
}

export { useVolunteer };
export type { VolunteerState };
