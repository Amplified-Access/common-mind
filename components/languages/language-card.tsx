import type { Model } from "@/components/models/data";
import type { Dataset } from "@/components/datasets/data";

import type { Language } from "./data";

type LanguageCardProps = {
  language: Language;
  models: Model[];
  datasets: Dataset[];
};

function LanguageCard({ language, models, datasets }: LanguageCardProps) {
  return (
    <article className="flex flex-col gap-6 rounded-3xl bg-white p-8 sm:p-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold tracking-tight text-black">
          {language.name}
        </h3>
        <p className="max-w-2xl text-gray-600">{language.tagline}</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Models ({models.length})
          </h4>
          <ul className="flex flex-col gap-2">
            {models.map((model) => (
              <li key={model.slug}>
                <a
                  href={`/models#${model.slug}`}
                  className="text-black/80 underline underline-offset-4 hover:no-underline"
                >
                  {model.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium tracking-widest text-gray-500 uppercase">
            Datasets ({datasets.length})
          </h4>
          <ul className="flex flex-col gap-2">
            {datasets.map((dataset) => (
              <li key={dataset.slug}>
                <a
                  href={`/datasets#${dataset.slug}`}
                  className="text-black/80 underline underline-offset-4 hover:no-underline"
                >
                  {dataset.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export { LanguageCard };
