import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { SignInPage } from "@/components/data-lab/sign-in-page";
import { safeNext } from "@/components/data-lab/sign-in-route";
import { Section } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Sign in · Data Lab",
};

export default async function DataLabSignInPage({ searchParams }: PageProps<"/data-lab/sign-in">) {
  const { next } = await searchParams;
  return (
    <Section className="pt-[calc(var(--header-height)+4rem)]">
      <Container>
        <SignInPage next={safeNext(next)} />
      </Container>
    </Section>
  );
}
