import { CodeBlock } from "./code-block";
import type { Model } from "./data";
import { highlightCode } from "./highlight";

async function ModelCard({ model }: { model: Model }) {
  const usageHtml = await highlightCode(model.usage.code, model.usage.language);

  return (
    <article className="rounded-3xl bg-white p-8 sm:p-12">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          {model.name}
        </h3>
        <p className="max-w-2xl text-gray-600">{model.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {model.platforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-gray-500"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-2">
        <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
          Overview
        </h4>
        <p className="text-black/80">{model.overview}</p>
      </div>

      <div className="mt-10">
        <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
          Performance metrics
        </h4>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {model.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-1">
              <span className="text-3xl font-semibold tracking-tight text-black">
                {metric.value}
              </span>
              <span className="text-sm text-gray-500">{metric.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Capabilities
          </h4>
          <ul className="flex flex-col gap-2">
            {model.capabilities.map((item) => (
              <li key={item} className="flex gap-2 text-black/80">
                <span aria-hidden className="text-gray-400">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Key achievements
          </h4>
          <ul className="flex flex-col gap-2">
            {model.achievements.map((item) => (
              <li key={item} className="flex gap-2 text-black/80">
                <span aria-hidden className="text-gray-400">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
          Usage example
        </h4>
        <CodeBlock code={model.usage.code} html={usageHtml} />
      </div>
    </article>
  );
}

export { ModelCard };
