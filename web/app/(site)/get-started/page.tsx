import {
  Accessibility,
  ChartEvaluation,
  Code,
  DataBase,
  DataCollection,
  Language,
  MachineLearningModel,
  Tag,
  TextMining,
  Translate,
  UserMultiple,
} from "@carbon/icons-react";
import Image from "next/image";
import Link from "next/link";

import { QuickstartRow, ResourceCard } from "@/components/get-started/resource-cards";
import { registryModels } from "@/components/models/registry";
import { LinkButton } from "@/components/system/primitives";
import { Emphasized, getPageCopy, pageMetadata } from "@/lib/copy";
import heroHead from "@/public/get-started/hero-head.webp";

export const generateMetadata = () => pageMetadata("getStarted", "/get-started");

// Where each link and card leads. The words are in lib/copy/pages/get-started.ts.
const firstModel = registryModels[0];

const sidebar = {
  start: [
    { id: "overview", href: "#overview" },
    { id: "quickstart", href: "/build#quickstart" },
    { id: "models", href: "/models" },
    { id: "datasets", href: "/datasets" },
    { id: "dataLab", href: "/data-lab" },
  ],
  developers: [
    { id: "api", href: "/build#api" },
    { id: "python", href: "/build#quickstart" },
    { id: "javascript", href: "/build#journey" },
  ],
  resources: [
    { id: "languages", href: "/languages" },
    { id: "benchmarks", href: "/benchmarks" },
    { id: "sign", href: "/sign" },
    { id: "contributing", href: "/data-lab" },
  ],
} as const;

const overview = [
  { id: "models", href: "/models", icon: MachineLearningModel },
  { id: "datasets", href: "/datasets", icon: DataBase, highlight: true },
  { id: "build", href: "/build", icon: Code },
  { id: "dataLab", href: "/data-lab", icon: DataCollection },
] as const;

const tasks = [
  { id: "translation", href: "/models#registry", icon: Translate },
  { id: "understanding", href: "/research/civic-corpus", icon: TextMining },
  { id: "languages", href: "/languages", icon: Language },
  { id: "classification", href: "/applications", icon: Tag },
  { id: "evaluation", href: "/benchmarks", icon: ChartEvaluation },
  { id: "sign", href: "/sign", icon: Accessibility },
  { id: "community", href: "/data-lab", icon: UserMultiple },
] as const;

const quickstarts = [
  { id: "python", href: "/build#quickstart" },
  { id: "javascript", href: "/build#journey" },
  { id: "modelCards", href: firstModel ? `/models/${firstModel.slug}` : "/models" },
  { id: "datasets", href: "/datasets#catalogue" },
  { id: "benchmarks", href: "/benchmarks#methodology" },
] as const;

// The mock's layout: a column of grouped links down the left, ruled off from
// the page, with the hero and the sections beside it.
const GetStartedPage = async () => {
  const copy = await getPageCopy("getStarted");
  return (
    <div className="zoom-viewport mx-auto grid max-w-360 pt-(--header-height) lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line lg:block">
        <nav aria-label="Get started" className="sticky top-(--header-height) flex flex-col gap-11 pt-14 pb-16 pl-12">
          {(Object.keys(sidebar) as (keyof typeof sidebar)[]).map((group) => (
            <div key={group} className="flex flex-col gap-3">
              <h2 className="text-lg">{copy.sidebar[group].title}</h2>
              <ul className="flex flex-col gap-1.5">
                {sidebar[group].map((link) => (
                  <li key={link.id}>
                    <Link href={link.href} className="text-[13px] text-faint transition-colors hover:text-signal">
                      {copy.sidebar[group][link.id as keyof (typeof copy.sidebar)[typeof group]]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <section className="relative isolate overflow-hidden border-b border-line">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(rgb(255_255_255/0.22)_1px,transparent_1.2px)] bg-size-[9px_9px] mask-[linear-gradient(to_bottom,#000,rgb(0_0_0/0.55))]"
          />
          {/* As wide as the sections below, so the face ends where they do. */}
          <div className="relative flex min-h-68 items-center px-4 py-12 md:px-8 lg:pl-16 xl:pr-12">
            <div className="relative z-10 flex max-w-88 flex-col items-start gap-4">
              <h1 className="text-h2">
                <Emphasized text={copy.hero.title} />
              </h1>
              <p className="text-sm text-pretty text-foreground/85">{copy.hero.lede}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <LinkButton href="/data-lab" variant="outline">
                  {copy.hero.secondaryCta}
                </LinkButton>
                <LinkButton href="/models">{copy.hero.primaryCta}</LinkButton>
              </div>
            </div>
            {/* Pinned to the content's right edge, then pushed past it by the
                image's empty margin (5.3% of its width), so the tip of the face
                lines up with the cards below. */}
            <Image
              src={heroHead}
              alt=""
              priority
              sizes="(min-width: 1024px) 512px, 80vw"
              className="pointer-events-none absolute top-1/2 right-4 w-[min(32rem,80%)] translate-x-[5.3%] -translate-y-1/2 rotate-[5.4deg] opacity-40 md:right-8 xl:right-12 max-md:opacity-25"
            />
          </div>
        </section>

        <div className="flex flex-col gap-20 px-4 pt-10 pb-24 md:px-8 lg:pl-16 xl:pr-12">
          {/* Every place to start, as one grid of cards: the site's main areas,
              then the things to build. */}
          <ul id="overview" className="grid scroll-mt-24 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {overview.map((card) => (
              <li key={card.id} className="flex min-w-0">
                <ResourceCard
                  href={card.href}
                  icon={card.icon}
                  highlight={"highlight" in card && card.highlight}
                  {...copy.overview[card.id]}
                />
              </li>
            ))}
            {tasks.map((card) => (
              <li key={card.id} className="flex min-w-0">
                <ResourceCard href={card.href} icon={card.icon} cta={copy.tasks.cta} {...copy.tasks[card.id]} />
              </li>
            ))}
          </ul>

          <section id="quickstarts" className="flex scroll-mt-24 flex-col gap-8">
            <Heading title={copy.quickstarts.title} lede={copy.quickstarts.lede} />
            <ul className="flex flex-col gap-4">
              {quickstarts.map((row) => (
                <li key={row.id} className="flex flex-col">
                  <QuickstartRow href={row.href} {...copy.quickstarts[row.id]} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

function Heading({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2">{title}</h2>
      <p className="max-w-sm text-sm text-pretty text-foreground/85">{lede}</p>
    </div>
  );
}

export default GetStartedPage;
