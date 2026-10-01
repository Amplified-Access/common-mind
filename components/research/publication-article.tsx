import Link from "next/link";

import { formatDate } from "@/components/models/registry";
import { Chevron } from "@/components/system/chevron";

import { readTimeForPublication, type Publication } from "./data";

function PublicationArticle({ publication }: { publication: Publication }) {
  return (
    <article className="flex flex-col gap-20">
      <header className="flex flex-col gap-6">
        <Link
          href="/research#papers"
          className="inline-flex items-center gap-1 self-start text-sm text-faint transition-colors hover:text-foreground"
        >
          <Chevron direction="left" />
          Research
        </Link>
        <h1 className="text-h1 text-balance">{publication.title}</h1>
        <p className="max-w-3xl text-lg text-pretty text-subtle sm:text-xl">
          {publication.dek}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-faint">
          <time dateTime={publication.date}>{formatDate(publication.date, "long")}</time>
          <span>CommonMind Research</span>
          <span>{readTimeForPublication(publication)} min read</span>
        </div>
      </header>

      {publication.results && (
        <div className="flex flex-col gap-6 rounded-3xl bg-surface p-8 sm:p-10">
          <p className="text-sm text-faint">{publication.results.caption}</p>
          <dl className="flex flex-col gap-4">
            {publication.results.rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-baseline justify-between gap-2"
              >
                <dt className="text-sm text-subtle">{row.label}</dt>
                <dd className="font-mono text-sm tabular-nums">
                  {row.before && (
                    <span className="text-faint">{row.before} → </span>
                  )}
                  <span className="text-foreground">{row.after}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="flex flex-col gap-16">
        {publication.sections.map((section) => (
          <section
            key={section.heading}
            className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10"
          >
            <h2 className="text-lg tracking-tight">
              {section.heading}
            </h2>
            <div className="flex max-w-2xl flex-col gap-4">
              {section.paragraphs.map((paragraph, j) => (
                <p key={j} className="leading-relaxed text-pretty text-foreground/85">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <span className="text-sm text-faint">Sources</span>
        <ul className="flex flex-col gap-2">
          {publication.sources.map((source) => {
            const isExternal = !source.href.startsWith("/");
            return (
              <li key={source.href}>
                <a
                  href={source.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="text-sm text-subtle transition-colors hover:text-signal"
                >
                  {source.label}
                  {isExternal ? " ↗" : ""}
                </a>
              </li>
            );
          })}
        </ul>
      </footer>
    </article>
  );
}

export { PublicationArticle };
