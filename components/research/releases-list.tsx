import type { Release } from "./data";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function ReleasesList({ releases }: { releases: Release[] }) {
  return (
    <div className="rounded-3xl bg-white p-8 sm:p-12">
      <ol className="flex flex-col">
        {releases.map((release, i) => (
          <li
            key={release.href}
            className={
              i > 0 ? "flex gap-6 border-t border-black/10 py-6" : "flex gap-6 pb-6"
            }
          >
            <time
              dateTime={release.date}
              className="w-28 shrink-0 text-sm text-gray-400"
            >
              {formatDate(release.date)}
            </time>
            <div className="flex flex-col gap-1">
              <a
                href={release.href}
                className="font-medium text-black underline underline-offset-4 hover:no-underline"
              >
                {release.title}
              </a>
              <p className="text-sm text-gray-600">{release.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { ReleasesList };
