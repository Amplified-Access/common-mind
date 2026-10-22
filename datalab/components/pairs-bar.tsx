import { cn } from "@/lib/utils";

// One language's sentence pairs as a share of the sentences available to
// translate: verified, then in review, then the untranslated rest. The three
// are stages of one process, so they're one ink in ordered steps that hold in
// both themes; text stays in text colors.
const SEGMENTS = {
  verified: { label: "Verified", fill: "bg-foreground" },
  review: { label: "In review", fill: "bg-foreground/45" },
  rest: { label: "Not yet translated", fill: "bg-foreground/12" },
} as const;

type Counts = { available: number; translated: number; verified: number };

const share = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

const percent = (part: number, whole: number) => {
  const p = share(part, whole);
  if (p === 0) return "0%";
  if (p < 1) return "<1%";
  return `${Math.round(p)}%`;
};

const n = (v: number) => v.toLocaleString("en-US");

function PairsBar({ available, translated, verified, language }: Counts & { language: string }) {
  const review = Math.max(translated - verified, 0);
  const rest = Math.max(available - translated, 0);
  const parts = [
    { key: "verified" as const, value: verified },
    { key: "review" as const, value: review },
    { key: "rest" as const, value: rest },
  ].filter((p) => p.value > 0);
  // Where each segment starts along the bar, in percent.
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((sum, q) => sum + share(q.value, available), 0));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xl tabular-nums">
          {percent(verified, available)} <span className="text-sm text-subtle">verified</span>
        </span>
        <span className="font-mono text-[11px] text-faint tabular-nums">
          {n(translated)} of {n(available)} translated
        </span>
      </div>

      <div
        role="img"
        aria-label={`${language}: ${n(verified)} verified, ${n(review)} in review, ${n(rest)} not yet translated, of ${n(available)} sentences`}
        className="flex h-2.5 gap-0.5"
      >
        {parts.length === 0 ? (
          <div className={cn("h-full flex-1 rounded-r-[4px]", SEGMENTS.rest.fill)} />
        ) : (
          parts.map((p, i) => (
            // The hover target is taller than the 10px mark.
            <div
              key={p.key}
              className="group relative -my-2 flex min-w-1 py-2"
              style={{ flexBasis: `${share(p.value, available)}%` }}
            >
              <div
                className={cn("h-full w-full", SEGMENTS[p.key].fill, i === parts.length - 1 && "rounded-r-[4px]")}
              />
              {/* Opens away from the nearer edge of the bar, so the card never clips it. */}
              <span
                className={cn(
                  "pointer-events-none absolute bottom-full z-10 mb-1 rounded-inset border border-line bg-background px-2 py-1 font-mono text-[11px] whitespace-nowrap text-foreground opacity-0 transition-opacity group-hover:opacity-100",
                  starts[i] < 50 ? "left-0" : "right-0",
                )}
              >
                {SEGMENTS[p.key].label} · {n(p.value)} ({percent(p.value, available)})
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { PairsBar };
