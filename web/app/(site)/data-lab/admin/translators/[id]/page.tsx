import { notFound, redirect } from "next/navigation";

import { AdminNotice } from "@/components/data-lab/admin/admin-shell";
import { fetchContributions, fetchLanguages, fetchTranslator } from "@/components/data-lab/admin/api";
import { ADMIN_PATH, adminPassword } from "@/components/data-lab/admin/session";
import { TranslatorDetail } from "@/components/data-lab/admin/translator-detail";
import { PAGE_SIZE, readView } from "@/lib/data-lab-admin/view";

export default async function TranslatorPage({ params, searchParams }: PageProps<"/data-lab/admin/translators/[id]">) {
  const password = await adminPassword();
  if (!password) redirect(ADMIN_PATH);

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const view = readView(await searchParams);

  const [translator, page, languages] = await Promise.all([
    fetchTranslator(password, id),
    fetchContributions(password, {
      contributor: id,
      language: view.language,
      status: view.status,
      limit: PAGE_SIZE,
      offset: (view.page - 1) * PAGE_SIZE,
    }),
    fetchLanguages(),
  ]);
  if (translator.status === "unauthorized" || page.status === "unauthorized") redirect(ADMIN_PATH);
  if (translator.status === "not_found") notFound();
  if (translator.status !== "ok" || page.status !== "ok") {
    const locked = translator.status === "locked" || page.status === "locked";
    return <AdminNotice status={locked ? "locked" : "unavailable"} />;
  }

  return <TranslatorDetail translator={translator.data} page={page.data} languages={languages} view={view} />;
}
