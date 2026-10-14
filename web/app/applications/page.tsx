import type { Metadata } from "next";

import { ApplicationGrid } from "@/components/applications/application-grid";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/system/page-hero";

export const metadata: Metadata = {
  title: "Applications",
  description: "Multilingual applications built on CommonMind, turning civic discourse into real world impact.",
};

const ApplicationsPage = () => {
  return (
    <PageHero
      eyebrow="Applications"
      title="From civic discourse to real world impact."
      lede="CommonMind enables developers and organisations to build multilingual AI applications that turn civic discourse into meaningful insights, expand access to public information and services, strengthen community participation, and support more informed public decisions."
      sideGrids
      className="pb-(--section-pad)"
      after={
        <Container size="lg">
          <ApplicationGrid />
        </Container>
      }
    />
  );
};

export default ApplicationsPage;
