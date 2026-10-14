import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { Contribute } from "@/components/data-lab/contribute";
import { Section } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Contribute · Data Lab",
};

export default async function ContributePage({ params }: PageProps<"/data-lab/contribute/[lang]">) {
  const { lang } = await params;
  return (
    <Section className="pt-[calc(var(--header-height)+3rem)]">
      <Container>
        <Contribute language={lang} />
      </Container>
    </Section>
  );
}
