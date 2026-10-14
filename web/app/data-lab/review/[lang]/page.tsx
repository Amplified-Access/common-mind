import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { Review } from "@/components/data-lab/review";
import { Section } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Review · Data Lab",
};

export default async function ReviewPage({ params }: PageProps<"/data-lab/review/[lang]">) {
  const { lang } = await params;
  return (
    <Section className="pt-[calc(var(--header-height)+3rem)]">
      <Container>
        <Review language={lang} />
      </Container>
    </Section>
  );
}
