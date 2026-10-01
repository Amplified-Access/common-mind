import Link from "next/link";

import { registryModels } from "./registry";

// The registry: a few columns that matter, laid out on whitespace.
function RegistryTable() {
  return (
    <div className="flex flex-col">
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-8 pb-6 text-sm text-faint lg:grid">
        <span>Model</span>
        <span>Direction</span>
        <span>Base</span>
        <span>BLEU</span>
        <span>License</span>
      </div>
      <ul className="flex flex-col gap-2">
        {registryModels.map((model) => (
          <li key={model.slug}>
            <Link
              href={`/models/${model.slug}`}
              className="group -mx-6 grid grid-cols-2 gap-x-8 gap-y-3 rounded-2xl px-6 py-6 transition-colors hover:bg-surface lg:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] lg:items-center"
            >
              <span className="col-span-2 text-lg tracking-tight transition-colors group-hover:text-signal lg:col-span-1">
                {model.name}
              </span>
              <span className="text-subtle">{model.directions.join(", ")}</span>
              <span className="text-subtle">
                {model.base.params} {model.architecture.split(" · ")[1]}
              </span>
              <span className="tabular-nums">
                {model.evaluation.bleu.toFixed(2)}
                {!model.evaluation.flores && (
                  <span className="ml-2 text-sm text-faint">held-out</span>
                )}
              </span>
              <span className="text-subtle">{model.license.split(" · ")[0]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { RegistryTable };
