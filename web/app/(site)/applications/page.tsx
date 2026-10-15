import { ApplicationGrid } from "@/components/applications/application-grid";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/system/page-hero";
import { getPageCopy, pageMetadata } from "@/lib/copy";

export const generateMetadata = () => pageMetadata("applications");

const ApplicationsPage = async () => {
  const copy = await getPageCopy("applications");
  return (
    <PageHero
      eyebrow={copy.hero.eyebrow}
      title={copy.hero.title}
      lede={copy.hero.lede}
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
