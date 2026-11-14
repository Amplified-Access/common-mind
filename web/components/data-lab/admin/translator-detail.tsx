import Link from "next/link";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";
import { acceptanceRate, adminHref, PAGE_SIZE, STATUSES, type AdminView } from "@/lib/data-lab-admin/view";

import { BackLink } from "../back-link";
import { secondaryButton } from "../styles";
import type { Language } from "../types";
import { categoryLabel, formatDate, languageNamer, levelLabel, rejectReasonLabel } from "./format";
import { FilterChips, Pill, StatRow, StatusPill } from "./parts";
import { ADMIN_PATH } from "./session";
import type { AdminContribution, AdminContributionPage, Translator } from "./types";

const statusLabel = { pending: "Pending", verified: "Verified", rejected: "Rejected" } as const;

/** One volunteer: who they are, their figures, and what they entered for each item. */
function TranslatorDetail({
  translator: t,
  page,
  languages,
  view,
}: {
  translator: Translator;
  page: AdminContributionPage;
  languages: Language[];
  view: AdminView;
}) {
  const nameOf = languageNamer(languages);
  const path = `${ADMIN_PATH}/translators/${t.id}`;
  const rate = acceptanceRate(t);
  const first = (view.page - 1) * PAGE_SIZE + 1;
  const last = first + page.contributions.length - 1;

  return (
    <section className="flex flex-col gap-8">
      <BackLink href={adminHref(ADMIN_PATH, { language: view.language, status: null, page: 1 })} label="All translators" />

      <div className="flex flex-col gap-3">
        <Eyebrow>Translator</Eyebrow>
        <h1 className="text-h2">{t.name || "Unnamed"}</h1>
        <p className="font-mono text-xs text-subtle">
          {t.email} · joined {formatDate(t.joined_at)} ·{" "}
          {t.languages
            .map((l) => `${nameOf(l.language_code)}${l.level ? ` (${levelLabel[l.level]})` : ""}: ${l.contributions}`)
            .join(", ") || "no languages"}
        </p>
      </div>

      <StatRow
        stats={[
          { label: "Written", value: t.written },
          { label: "Recorded", value: t.recorded },
          { label: t.corrected ? `Verified · ${t.corrected} corrected` : "Verified", value: t.verified },
          { label: "Waiting for review", value: t.pending },
          { label: "Accepted", value: rate === null ? "—" : `${rate}%` },
          { label: "Reviews of others", value: t.reviewed },
        ]}
      />

      <div className="flex flex-col gap-3">
        {t.languages.length > 1 && (
          <FilterChips
            label="Language"
            options={[
              { label: "All languages", href: adminHref(path, { ...view, language: null, page: 1 }), current: !view.language },
              ...t.languages.map((m) => ({
                label: nameOf(m.language_code),
                href: adminHref(path, { ...view, language: m.language_code, page: 1 }),
                current: view.language === m.language_code,
              })),
            ]}
          />
        )}
        <FilterChips
          label="Status"
          options={[
            { label: "Everything", href: adminHref(path, { ...view, status: null, page: 1 }), current: !view.status },
            ...STATUSES.map((s) => ({
              label: statusLabel[s],
              href: adminHref(path, { ...view, status: s, page: 1 }),
              current: view.status === s,
            })),
          ]}
        />
      </div>

      {page.contributions.length === 0 ? (
        <p className="font-mono text-xs text-faint">Nothing here yet.</p>
      ) : (
        <>
          <p className="font-mono text-xs text-faint">
            {first}–{last} of {page.total}, newest first
          </p>
          <ol className="flex flex-col gap-4">
            {page.contributions.map((c) => (
              <li key={c.id}>
                <ContributionCard contribution={c} nameOf={nameOf} />
              </li>
            ))}
          </ol>
          <Pager path={path} view={view} total={page.total} />
        </>
      )}
    </section>
  );
}

/** The item on the left, what the volunteer entered on the right, and the review below. */
function ContributionCard({ contribution: c, nameOf }: { contribution: AdminContribution; nameOf: (code: string) => string }) {
  const entered = c.modality === "audio" ? "Recording" : c.kind === "translate" ? "Translation" : "Answer";
  return (
    <FramedCard panelsClassName="flex flex-col gap-px bg-[#131000]">
      <div className="grid gap-px md:grid-cols-2">
        <div className="flex flex-col gap-3 bg-[#1c1a0e] p-5 sm:p-6">
          <Eyebrow tone="foreground">
            {c.kind === "translate" ? "Original" : "Prompt"} · {nameOf(c.item_language)}
          </Eyebrow>
          <p lang={c.item_language} className="text-lg leading-snug text-pretty">
            {c.item_text}
          </p>
          <span className="mt-auto font-mono text-xs text-faint">
            {categoryLabel(c.category)} · {c.source_title}
          </span>
        </div>
        <div className="flex flex-col gap-3 bg-[#1c1a0e] p-5 sm:p-6">
          <Eyebrow>
            {entered} · {nameOf(c.language_code)}
          </Eyebrow>
          {c.modality === "audio" ? (
            <>
              <p lang={c.language_code} className="text-lg leading-snug text-pretty whitespace-pre-line">
                {c.read_text}
              </p>
              {c.audio_url ? (
                <audio controls preload="none" src={c.audio_url} className="h-10 w-full" />
              ) : (
                <p className="font-mono text-xs text-faint">The recording can&apos;t be played here.</p>
              )}
            </>
          ) : (
            <p lang={c.language_code} className="text-lg leading-snug text-pretty whitespace-pre-line">
              {c.text}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#0b0a07] px-5 py-3 sm:px-6">
        <StatusPill status={c.status} />
        {c.pasted && <Pill>Pasted in</Pill>}
        <span className="font-mono text-xs text-faint">Submitted {formatDate(c.submitted_at)}</span>
        {c.review && <ReviewLine contribution={c} />}
      </div>
    </FramedCard>
  );
}

function ReviewLine({ contribution: c }: { contribution: AdminContribution }) {
  const r = c.review;
  if (!r) return null;
  const by = `by ${r.reviewer_name || "a reviewer"} on ${formatDate(r.reviewed_at)}`;
  return (
    <div className="flex w-full flex-col gap-1 text-sm text-subtle">
      {r.decision === "accept" && <span>Accepted {by}</span>}
      {r.decision === "correct" && (
        <>
          <span>Corrected {by} to:</span>
          <span lang={c.language_code} className="text-foreground whitespace-pre-line">
            {r.corrected_text}
          </span>
        </>
      )}
      {r.decision === "reject" && (
        <span>
          Rejected {by}: {rejectReasonLabel[r.reason ?? ""] ?? r.reason}
        </span>
      )}
      {r.note && <span className="text-faint">Note: {r.note}</span>}
    </div>
  );
}

function Pager({ path, view, total }: { path: string; view: AdminView; total: number }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-4">
      {view.page > 1 ? (
        <Link href={adminHref(path, { ...view, page: view.page - 1 })} className={secondaryButton}>
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-faint">
        Page {view.page} of {pages}
      </span>
      {view.page < pages ? (
        <Link href={adminHref(path, { ...view, page: view.page + 1 })} className={secondaryButton}>
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export { TranslatorDetail };
