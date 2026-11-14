import Link from "next/link";

import { FramedCard } from "@/components/system/framed-card";
import { cn } from "@/lib/utils";

/** A row of links that switch the view; the current one is lit. */
function FilterChips({ label, options }: { label: string; options: { label: string; href: string; current: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.current ? "page" : undefined}
          className={cn(
            "inline-flex h-8 items-center rounded-full border px-4 font-mono text-xs leading-none transition-colors",
            o.current ? "border-signal text-signal" : "border-line-strong text-subtle hover:border-signal hover:text-foreground",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

/** Figures side by side, each a number over its label. */
function StatRow({ stats }: { stats: { label: string; value: number | string }[] }) {
  return (
    <FramedCard panelsClassName="grid grid-cols-2 gap-px bg-[#131000] sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-2 bg-[#1c1a0e] p-5">
          <span className="text-h3 tabular-nums">{s.value}</span>
          <span className="font-mono text-xs text-faint">{s.label}</span>
        </div>
      ))}
    </FramedCard>
  );
}

const statusTone = {
  pending: "border-line-strong text-subtle",
  verified: "border-signal/60 text-signal",
  rejected: "border-destructive/60 text-destructive",
} as const;

const statusLabel = { pending: "Pending", verified: "Verified", rejected: "Rejected" } as const;

/** A small fixed-height pill. */
function Pill({ tone = "border-line-strong text-subtle", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[11px] leading-none", tone)}>
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: keyof typeof statusTone }) {
  return <Pill tone={statusTone[status]}>{statusLabel[status]}</Pill>;
}

export { FilterChips, Pill, StatRow, StatusPill };
