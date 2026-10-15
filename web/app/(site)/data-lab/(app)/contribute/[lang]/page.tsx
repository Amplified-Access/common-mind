import type { Metadata } from "next";

import { Contribute } from "@/components/data-lab/contribute";

export const metadata: Metadata = {
  title: "Contribute · Data Lab",
};

export default async function ContributePage({ params }: PageProps<"/data-lab/contribute/[lang]">) {
  const { lang } = await params;
  return <Contribute language={lang} />;
}
