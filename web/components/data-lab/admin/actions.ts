"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Level } from "../types";
import { fetchTranslators, putLevel } from "./api";
import { ADMIN_COOKIE, ADMIN_PATH, ADMIN_SESSION_SECONDS, adminPassword } from "./session";

export type SignInState = { error: string | null };

/**
 * Checks the password with the backend and, when it's right, keeps it in an
 * httpOnly cookie scoped to the admin, which its pages send with each read.
 * A wrong password is never stored.
 */
export async function signInToAdmin(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const password = String(formData.get("password") ?? "").trim();
  if (!password) return { error: "Enter the password." };

  const result = await fetchTranslators(password, null);
  if (result.status === "unauthorized") return { error: "That password isn't right." };
  if (result.status === "locked") return { error: "Too many wrong passwords were tried. Wait a minute, then try again." };
  if (result.status !== "ok") return { error: "The Data Lab can't be reached. Try again in a moment." };

  (await cookies()).set(ADMIN_COOKIE, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: ADMIN_PATH,
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect(ADMIN_PATH);
}

/** Forgets the password on this device. */
export async function signOutOfAdmin() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: ADMIN_PATH });
  redirect(ADMIN_PATH);
}

export type LevelState = { error: string | null };

const LEVELS: readonly Level[] = ["contributor", "reviewer", "lead"];

/**
 * Sets a volunteer's level in one of their languages, with the password
 * this browser signed in with, then shows the page again with it.
 */
export async function setTranslatorLevel(_previous: LevelState, formData: FormData): Promise<LevelState> {
  const password = await adminPassword();
  if (!password) redirect(ADMIN_PATH);

  const id = Number(formData.get("id"));
  const language = String(formData.get("language") ?? "");
  const level = String(formData.get("level") ?? "") as Level;
  if (!Number.isInteger(id) || id <= 0 || !language || !LEVELS.includes(level)) {
    return { error: "That change can't be made." };
  }

  const result = await putLevel(password, id, language, level);
  switch (result.status) {
    case "ok":
      revalidatePath(`${ADMIN_PATH}/translators/${id}`);
      revalidatePath(ADMIN_PATH);
      return { error: null };
    case "unauthorized":
      // The password changed since they signed in.
      redirect(ADMIN_PATH);
    case "not_found":
      return { error: "They're no longer in this language." };
    case "locked":
      return { error: "Too many wrong passwords were tried. Wait a minute, then try again." };
    case "invalid":
      return { error: "That change can't be made." };
    default:
      return { error: "The Data Lab can't be reached. Try again in a moment." };
  }
}
