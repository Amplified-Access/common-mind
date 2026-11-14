import { AdminNotice } from "@/components/data-lab/admin/admin-shell";
import { fetchLanguages, fetchTranslators } from "@/components/data-lab/admin/api";
import { adminPassword } from "@/components/data-lab/admin/session";
import { AdminSignInForm } from "@/components/data-lab/admin/sign-in-form";
import { TranslatorsOverview } from "@/components/data-lab/admin/translators-overview";
import { readView } from "@/lib/data-lab-admin/view";

export default async function DataLabAdminPage({ searchParams }: PageProps<"/data-lab/admin">) {
  const password = await adminPassword();
  if (!password) return <AdminSignInForm />;

  const view = readView(await searchParams);
  const [result, languages] = await Promise.all([fetchTranslators(password, view.language), fetchLanguages()]);
  if (result.status === "unauthorized") return <AdminSignInForm notice="The password has changed. Sign in again." />;
  if (result.status !== "ok") return <AdminNotice status={result.status === "locked" ? "locked" : "unavailable"} />;

  return <TranslatorsOverview translators={result.data} languages={languages} view={view} />;
}
