import type { Dataset } from "./data";

function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <article
      id={dataset.slug}
      className="scroll-mt-24 flex flex-col gap-4 rounded-3xl bg-white p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-black">
          {dataset.name}
        </h3>
        <span className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500">
          {dataset.source}
        </span>
      </div>

      <p className="text-black/80">{dataset.description}</p>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {dataset.usedBy.map((model) => (
            <span
              key={model}
              className="rounded-full bg-[#f4f4f4] px-3 py-1 text-xs font-medium text-gray-600"
            >
              {model}
            </span>
          ))}
        </div>

        <a
          href={dataset.href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-black underline underline-offset-4 hover:no-underline"
        >
          View dataset →
        </a>
      </div>
    </article>
  );
}

export { DatasetCard };
