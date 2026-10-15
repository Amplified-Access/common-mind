import { CivicExplorer } from "@/components/civic/civic-explorer";
import { TerminologyViewer } from "@/components/civic/terminology-viewer";
import { Container } from "@/components/common/container";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, Panel, Section, SectionHeader } from "@/components/system/primitives";
import { getPageCopy, pageMetadata } from "@/lib/copy";
import { cn } from "@/lib/utils";

export const generateMetadata = () => pageMetadata("civicCorpus");

// Training mixtures as reported in each technical report. Totals are the sum
// of the listed sources.
const mixtures = [
  {
    name: "Swahili-gemma-1B-it",
    unit: "listed examples",
    parts: [
      { label: "Rogendo", value: 58052 },
      { label: "MAFAND-MT", value: 32414 },
      { label: "Inkuba", value: 29991 },
      { label: "SALT", value: 23947 },
      { label: "Alpaca", value: 14844 },
      { label: "Aya", value: 359 },
    ],
  },
  {
    name: "Swahili-nllb",
    unit: "listed sentence pairs",
    parts: [
      { label: "Rogendo", value: 60000 },
      { label: "MAFAND-MT", value: 32414 },
      { label: "Inkuba", value: 30000 },
      { label: "SALT", value: 23947 },
    ],
  },
];

const shades = ["bg-signal", "bg-teal", "bg-ocean", "bg-lilac", "bg-other", "bg-white/25"];

const PRINCIPLES = ["consent", "purpose", "privacy", "validation"] as const;

const CivicCorpusPage = async () => {
  const copy = await getPageCopy("civicCorpus");
  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lede={copy.hero.lede}
        tags={copy.hero.tags}
      >
        <div>
          <LinkButton href="/data-lab">{copy.hero.cta}</LinkButton>
        </div>
      </PageHero>

      <Section id="scope">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow={copy.scope.eyebrow}
            title={copy.scope.title}
            lede={copy.scope.lede}
            layout="split"
          />
          <CivicExplorer />
        </Container>
      </Section>

      <Section id="terminology" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow={copy.terminology.eyebrow}
            title={copy.terminology.title}
            lede={copy.terminology.lede}
            layout="split"
          />
          <TerminologyViewer />
        </Container>
      </Section>

      <Section id="composition" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader
            eyebrow={copy.composition.eyebrow}
            title={copy.composition.title}
            lede={copy.composition.lede}
            layout="split"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {mixtures.map((mix) => {
              const sum = mix.parts.reduce((a, p) => a + p.value, 0);
              return (
                <Panel key={mix.name} className="flex flex-col gap-6 p-7 sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-lg">{mix.name}</span>
                    <span className="font-mono text-xs text-faint">
                      {sum.toLocaleString("en-US")} {mix.unit}
                    </span>
                  </div>
                  <div className="flex h-2.5 gap-1">
                    {mix.parts.map((p, i) => (
                      <span
                        key={p.label}
                        className={cn("h-full rounded-full", shades[i])}
                        style={{ width: `${(p.value / sum) * 100}%` }}
                      />
                    ))}
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-faint">
                    {mix.parts.map((p, i) => (
                      <li key={p.label} className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", shades[i])} />
                        {p.label} · {p.value.toLocaleString("en-US")}
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section id="collection" className="border-t border-line">
        <Container className="flex flex-col gap-14">
          <SectionHeader eyebrow={copy.collection.eyebrow} title={copy.collection.title} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((key) => (
              <li key={key} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
                <span className="font-mono text-lg">{copy.collection[key].title}</span>
                <span className="text-sm text-faint">{copy.collection[key].text}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
};

export default CivicCorpusPage;
