import "server-only";

import { cookies } from "next/headers";

/** Where the admin lives; its cookie is sent to these pages only. */
export const ADMIN_PATH = "/data-lab/admin";

/** The cookie that holds the admin password once the backend has accepted it. */
export const ADMIN_COOKIE = "data_lab_admin";

/** How long a sign-in lasts: a working day. */
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

/** The password this browser signed in with, or null. */
export async function adminPassword(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}
