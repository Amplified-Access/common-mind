import type { Metadata } from "next";

import { Review } from "@/components/review";

export const metadata: Metadata = {
  title: "Review · Data Lab",
};

export default async function ReviewPage({ params }: PageProps<"/review/[lang]">) {
  const { lang } = await params;
  return <Review language={lang} />;
}
