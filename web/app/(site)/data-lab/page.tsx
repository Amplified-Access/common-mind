import { Container } from "@/components/common/container";
import { DataLabHome } from "@/components/data-lab/data-lab-home";
import { HeroAction } from "@/components/data-lab/hero-action";
import { PageHero } from "@/components/system/page-hero";
import { Section } from "@/components/system/primitives";
import { TagChain } from "@/components/system/tag-chain";
import { getPageCopy, pageMetadata } from "@/lib/copy";

export const generateMetadata = () => pageMetadata("dataLab", "/data-lab");

const DataLabPage = async () => {
  const copy = await getPageCopy("dataLab");
  return (
    <>
      <PageHero
        align="columns"
        sideGrids
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lede={copy.hero.lede}
        beneathTitle={<HeroAction signIn={copy.hero.signIn} openWorkspace={copy.hero.openWorkspace} />}
        beneathLede={<TagChain tags={copy.hero.tags} className="lg:flex-nowrap" />}
      />
      <Section className="pt-0">
        <Container>
          <DataLabHome copy={copy.progress} />
        </Container>
      </Section>
    </>
  );
};

export default DataLabPage;
