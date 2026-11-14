import type { Metadata } from "next";

import { AdminShell } from "@/components/data-lab/admin/admin-shell";
import { adminPassword } from "@/components/data-lab/admin/session";

export const metadata: Metadata = {
  title: "Admin | Data Lab",
  robots: { index: false, follow: false },
};

// The team's view of every volunteer's work, behind the shared ADMIN_PASSWORD
// (backend/docs/data-lab-admin.md). A standalone page: no site header or footer.
export default async function DataLabAdminLayout({ children }: LayoutProps<"/data-lab/admin">) {
  const signedIn = (await adminPassword()) !== null;
  return <AdminShell signedIn={signedIn}>{children}</AdminShell>;
}
