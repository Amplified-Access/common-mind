import type { Publication } from "./data";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function PublicationCard({ publication }: { publication: Publication }) {
  return (
    <article
      id={publication.slug}
      className="scroll-mt-24 rounded-3xl bg-white p-8 sm:p-12"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {publication.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          {publication.title}
        </h3>
        <p className="max-w-2xl text-gray-600">{publication.dek}</p>
        <time dateTime={publication.date} className="text-sm text-gray-400">
          {formatDate(publication.date)} · CommonMind Team
        </time>
      </div>

      {publication.results && (
        <div className="mt-8 overflow-x-auto rounded-2xl bg-[#f4f4f4] p-6">
          <p className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            {publication.results.caption}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {publication.results.rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/5 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-black/70">{row.label}</span>
                <span className="font-medium text-black">
                  {row.before && (
                    <>
                      <span className="text-gray-400 line-through">
                        {row.before}
                      </span>{" "}
                      →{" "}
                    </>
                  )}
                  {row.after}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8">
        {publication.sections.map((section) => (
          <div key={section.heading} className="flex flex-col gap-3">
            <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
              {section.heading}
            </h4>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-black/80">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-6">
        <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
          Sources
        </h4>
        <ul className="flex flex-col gap-1.5">
          {publication.sources.map((source) => {
            const isExternal = !source.href.startsWith("/");
            return (
              <li key={source.href}>
                <a
                  href={source.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="text-sm text-black/60 underline underline-offset-4 hover:text-black"
                >
                  {source.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

export { PublicationCard };
