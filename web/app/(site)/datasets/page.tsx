import { Container } from "@/components/common/container";
import { DatasetGrid } from "@/components/datasets/dataset-grid";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton } from "@/components/system/primitives";
import { getContent } from "@/lib/content";
import { getPageCopy, pageMetadata } from "@/lib/copy";

export const generateMetadata = () => pageMetadata("datasets");

const DatasetsPage = async () => {
  const [{ datasets }, copy] = await Promise.all([getContent(), getPageCopy("datasets")]);
  return (
    <PageHero
      align="split"
      sideGrids
      eyebrow={copy.hero.eyebrow}
      title={copy.hero.title}
      lede={copy.hero.lede}
      tags={copy.hero.tags}
      className="pb-(--section-pad)"
      after={
        <Container id="catalogue" className="scroll-mt-24">
          <DatasetGrid datasets={datasets} copy={copy.catalogue} />
        </Container>
      }
    >
      <div>
        <LinkButton href="#catalogue">{copy.hero.cta}</LinkButton>
      </div>
    </PageHero>
  );
};

export default DatasetsPage;
