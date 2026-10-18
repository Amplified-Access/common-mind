import {
  Analytics01Icon,
  BookOpen01Icon,
  Database01Icon,
  DashboardSquare01Icon,
  LanguageSkillIcon,
  SourceCodeIcon,
  Tag01Icon,
  TranslateIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { Container } from "@/components/common/container";
import { QuickstartRow, ResourceCard } from "@/components/get-started/resource-cards";
import { BuildIcon } from "@/components/icons/page-icons";
import { registryModels } from "@/components/models/registry";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, SectionHeader } from "@/components/system/primitives";
import { SideNav } from "@/components/system/side-nav";
import { Emphasized, getPageCopy, pageMetadata } from "@/lib/copy";
import { site } from "@/lib/site";

export const generateMetadata = () => pageMetadata("getStarted");

// Where each card on the page leads. The words are in lib/copy/pages/get-started.ts.
const overview = [
  { id: "models", href: "/models", icon: DashboardSquare01Icon },
  { id: "datasets", href: "/datasets", icon: Database01Icon, highlight: true },
  { id: "build", href: "/build", icon: SourceCodeIcon },
  { id: "dataLab", href: "/data-lab", icon: Database01Icon },
] as const;

const tasks = [
  { id: "translation", href: "/models#registry", icon: TranslateIcon },
  { id: "languages", href: "/languages", icon: LanguageSkillIcon },
  { id: "terminology", href: "/research/civic-corpus", icon: BookOpen01Icon },
  { id: "classification", href: "/applications", icon: Tag01Icon },
  { id: "evaluation", href: "/benchmarks", icon: Analytics01Icon },
  { id: "community", href: "/data-lab", icon: UserGroupIcon },
] as const;

const firstModel = registryModels[0];

const quickstarts = [
  { id: "python", href: "/build#quickstart" },
  { id: "api", href: "/build#api" },
  { id: "modelCards", href: firstModel ? `/models/${firstModel.slug}` : "/models" },
  { id: "datasets", href: "/datasets#catalogue" },
  { id: "benchmarks", href: "/benchmarks#methodology" },
] as const;

const GetStartedPage = async () => {
  const copy = await getPageCopy("getStarted");
  const sections = [
    { id: "overview", label: copy.nav.overview },
    { id: "tasks", label: copy.nav.tasks },
    { id: "quickstarts", label: copy.nav.quickstarts },
  ];
  return (
    <>
      <PageHero
        ruled
        sideGrids
        tile={BuildIcon}
        eyebrow={copy.hero.eyebrow}
        title={<Emphasized text={copy.hero.title} />}
        lede={copy.hero.lede}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href={site.links.huggingface} variant="outline">
            Hugging Face
          </LinkButton>
          <LinkButton href="/build#quickstart">{copy.hero.primaryCta}</LinkButton>
        </div>
      </PageHero>

      <section className="zoom-viewport relative py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <SideNav items={sections} className="sticky top-24" />
          </aside>

          <div className="flex min-w-0 flex-col gap-24">
            <div id="overview" className="flex scroll-mt-24 flex-col gap-10">
              <SectionHeader
                eyebrow={copy.overview.eyebrow}
                title={copy.overview.title}
                lede={copy.overview.lede}
              />
              <ul className="grid gap-5 md:grid-cols-2">
                {overview.map((card) => (
                  <li key={card.id} className="flex">
                    <ResourceCard
                      href={card.href}
                      icon={card.icon}
                      highlight={"highlight" in card && card.highlight}
                      {...copy.overview[card.id]}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div id="tasks" className="flex scroll-mt-24 flex-col gap-10">
              <SectionHeader eyebrow={copy.tasks.eyebrow} title={copy.tasks.title} lede={copy.tasks.lede} />
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {tasks.map((card) => (
                  <li key={card.id} className="flex">
                    <ResourceCard
                      size="task"
                      href={card.href}
                      icon={card.icon}
                      cta={copy.tasks.cta}
                      {...copy.tasks[card.id]}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div id="quickstarts" className="flex scroll-mt-24 flex-col gap-10">
              <SectionHeader
                eyebrow={copy.quickstarts.eyebrow}
                title={copy.quickstarts.title}
                lede={copy.quickstarts.lede}
              />
              <ul className="flex flex-col gap-4">
                {quickstarts.map((row) => (
                  <li key={row.id} className="flex flex-col">
                    <QuickstartRow href={row.href} {...copy.quickstarts[row.id]} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default GetStartedPage;
