import Link from "next/link";

import { FramedCard } from "@/components/system/framed-card";
import { Eyebrow } from "@/components/system/primitives";
import { acceptanceRate, adminHref, type AdminView } from "@/lib/data-lab-admin/view";
import { cn } from "@/lib/utils";

import type { Language } from "../types";
import { formatDate, languageNamer } from "./format";
import { FilterChips, StatRow } from "./parts";
import { ADMIN_PATH } from "./session";
import type { Translator } from "./types";

const sum = (translators: Translator[], key: "written" | "recorded" | "verified" | "pending" | "rejected") =>
  translators.reduce((n, t) => n + t[key], 0);

/** Every volunteer and how much they've done, most first, in one language or all. */
function TranslatorsOverview({ translators, languages, view }: { translators: Translator[]; languages: Language[]; view: AdminView }) {
  const nameOf = languageNamer(languages);
  const targets = languages.filter((l) => l.role === "target");
  const translatorHref = (id: number) =>
    adminHref(`${ADMIN_PATH}/translators/${id}`, { language: view.language, status: null, page: 1 });

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Eyebrow>Admin</Eyebrow>
        <h1 className="text-h2">Translators</h1>
      </div>

      <FilterChips
        label="Language"
        options={[
          { label: "All languages", href: ADMIN_PATH, current: !view.language },
          ...targets.map((l) => ({
            label: l.name,
            href: adminHref(ADMIN_PATH, { language: l.code, status: null, page: 1 }),
            current: view.language === l.code,
          })),
        ]}
      />

      <StatRow
        stats={[
          { label: "Volunteers", value: translators.length },
          { label: "Written", value: sum(translators, "written") },
          { label: "Recorded", value: sum(translators, "recorded") },
          { label: "Verified", value: sum(translators, "verified") },
          { label: "Waiting for review", value: sum(translators, "pending") },
          { label: "Rejected", value: sum(translators, "rejected") },
        ]}
      />

      {translators.length === 0 ? (
        <p className="font-mono text-xs text-faint">
          No volunteers{view.language ? ` in ${nameOf(view.language)}` : ""} yet.
        </p>
      ) : (
        <FramedCard panelsClassName="overflow-x-auto bg-[#1c1a0e]">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-line font-mono text-xs text-faint">
              <tr>
                <th className="px-5 py-3 font-normal">Translator</th>
                <th className="px-3 py-3 font-normal">Languages</th>
                <Num>Written</Num>
                <Num>Recorded</Num>
                <Num>Verified</Num>
                <Num>Pending</Num>
                <Num>Rejected</Num>
                <Num>Accepted</Num>
                <Num>Reviews</Num>
                <th className="px-5 py-3 font-normal">Last active</th>
              </tr>
            </thead>
            <tbody>
              {translators.map((t) => {
                const rate = acceptanceRate(t);
                return (
                  <tr key={t.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <Link href={translatorHref(t.id)} className="flex flex-col gap-1 hover:text-signal">
                        <span className="font-medium">{t.name || "Unnamed"}</span>
                        <span className="font-mono text-xs text-faint">{t.email}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {/* Every language they joined, with what they've done in it: 0 marks one they haven't started. */}
                      <ul className="flex flex-col gap-1">
                        {t.languages.map((l) => (
                          <li
                            key={l.language_code}
                            className={cn(
                              "flex justify-between gap-4 whitespace-nowrap",
                              l.contributions > 0 ? "text-subtle" : "text-faint",
                            )}
                          >
                            <span>{nameOf(l.language_code)}</span>
                            <span className={cn("tabular-nums", l.contributions > 0 && "text-foreground")}>
                              {l.contributions}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <Num cell>{t.written}</Num>
                    <Num cell>{t.recorded}</Num>
                    <Num cell>
                      {t.verified}
                      {t.corrected > 0 && <span className="block font-mono text-[11px] text-faint">{t.corrected} corrected</span>}
                    </Num>
                    <Num cell>{t.pending}</Num>
                    <Num cell>{t.rejected}</Num>
                    <Num cell>{rate === null ? "—" : `${rate}%`}</Num>
                    <Num cell>{t.reviewed}</Num>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap text-subtle">
                      {t.last_active_at ? formatDate(t.last_active_at) : "Never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </FramedCard>
      )}
    </section>
  );
}

/** A right-aligned number column, as a header or (cell) a body cell. */
function Num({ cell, children }: { cell?: boolean; children: React.ReactNode }) {
  return cell ? (
    <td className="px-3 py-4 text-right tabular-nums">{children}</td>
  ) : (
    <th className="px-3 py-3 text-right font-normal">{children}</th>
  );
}

export { TranslatorsOverview };
