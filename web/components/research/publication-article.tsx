import { formatDate } from "@/components/models/registry";
import { ArrowLink, Panel } from "@/components/system/primitives";

import type { Publication } from "@/lib/content/types";

// The body of a technical report: headline results, then the write-up in
// one reading column, then its sources.
function PublicationArticle({ publication }: { publication: Publication }) {
  return (
    <article className="flex flex-col gap-16">
      <p className="font-mono text-sm text-faint">
        <time dateTime={publication.date}>{formatDate(publication.date, "long")}</time>
        <span className="px-3">·</span>CommonMind Research
      </p>

      {publication.results && (
        <Panel className="overflow-hidden">
          <h2 className="border-b border-line px-6 py-4 font-mono text-base sm:px-10">
            {publication.results.caption}
          </h2>
          <dl className="flex flex-col gap-3 px-6 py-6 sm:px-10">
            {publication.results.rows.map((row) => (
              <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm">
                <dt className="text-foreground/90">{row.label}</dt>
                <dd className="tabular-nums">
                  {row.before && <span className="text-faint">{row.before} → </span>}
                  <span className="text-signal">{row.after}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {publication.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-5">
          <h2 className="text-[1.75rem] leading-tight tracking-[-0.01em]">{section.heading}</h2>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-pretty text-subtle">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <footer className="flex flex-col gap-5 border-t border-line pt-8">
        <span className="font-mono text-sm">Sources</span>
        <ul className="flex flex-col gap-3">
          {publication.sources.map((source) => (
            <li key={source.href}>
              <ArrowLink href={source.href}>{source.label}</ArrowLink>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

export { PublicationArticle };
