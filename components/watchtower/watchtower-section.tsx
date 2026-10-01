import { Container } from "@/components/common/container";
import { ArrowLink, Section } from "@/components/system/primitives";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const flow = ["Community reports", "CommonMind", "Structured evidence", "Live map"];

// Deterministic dot field for the abstract map: no real geography and no
// real reports.
const GRID = 48;
const CLUSTERS: [number, number, number][] = [
  [14, 17, 6.5],
  [33, 12, 5.2],
  [29, 33, 5.6],
  [11, 36, 4.2],
  [41, 27, 3.8],
];
const dots = Array.from({ length: GRID * GRID }, (_, i) => {
  const x = i % GRID;
  const y = Math.floor(i / GRID);
  const n = Math.abs(Math.sin(x * 7.13 + y * 3.71) * 9301.17) % 1;
  const cluster = CLUSTERS.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r);
  return { x, y, lit: cluster && n > 0.35, dim: n > 0.55, delay: (i % 13) * 0.27 };
});

function WatchTowerSection({ id = "watchtower" }: { id?: string }) {
  return (
    <Section id={id}>
      <Container className="grid gap-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-24">
        <div className="flex flex-col gap-8">
          <h2 className="text-h2 text-balance">WatchTower.</h2>
          <p className="max-w-lg text-lg text-pretty text-subtle">
            Our reference application turns community voice into structured
            evidence. Deployed in Kenya with a human rights partner to map
            reported incidents of technology-facilitated gender-based violence.
          </p>
          <ArrowLink href={site.org.href}>{site.org.name}</ArrowLink>
        </div>

        <div className="flex flex-col gap-8">
          <div className="aspect-square w-full rounded-3xl bg-surface p-6 sm:p-10">
            <svg aria-hidden viewBox={`0 0 ${GRID} ${GRID}`} className="size-full">
              {dots.map((dot, i) => (
                <circle
                  key={i}
                  cx={dot.x + 0.5}
                  cy={dot.y + 0.5}
                  r={0.26}
                  className={cn(
                    dot.lit ? "fill-signal" : dot.dim ? "fill-white/12" : "fill-white/5",
                  )}
                  style={
                    dot.lit
                      ? { animation: `cm-pulse 3.2s ease-in-out ${dot.delay}s infinite` }
                      : undefined
                  }
                />
              ))}
            </svg>
          </div>
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {flow.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className={step === "CommonMind" ? "text-signal" : "text-subtle"}>
                  {step}
                </span>
                {i < flow.length - 1 && <span className="text-faint">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

export { WatchTowerSection };
