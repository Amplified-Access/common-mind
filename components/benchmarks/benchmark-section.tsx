import { BarChart } from "./bar-chart";
import type { LanguageBenchmark } from "./data";

function BenchmarkSection({ benchmark }: { benchmark: LanguageBenchmark }) {
  const sortedForTable = [...benchmark.entries].sort((a, b) => b.bleu - a.bleu);

  return (
    <article className="rounded-3xl bg-white p-8 sm:p-12">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          {benchmark.label}
        </h3>
        <p className="text-sm text-gray-500">{benchmark.evalSet}</p>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <span className="flex items-center gap-2 text-sm text-black/70">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "#2a78d6" }}
          />
          CommonMind
        </span>
        <span className="flex items-center gap-2 text-sm text-black/70">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "#7d7b74" }}
          />
          Other models
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <BarChart title="BLEU" entries={benchmark.entries} metric="bleu" />
        <BarChart title="chrF++" entries={benchmark.entries} metric="chrf" />
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">
            {benchmark.label} benchmark results and sources
          </caption>
          <thead>
            <tr className="border-b border-black/10 text-left text-xs font-medium tracking-widest text-gray-500 uppercase">
              <th scope="col" className="py-2 pr-4">
                Model
              </th>
              <th scope="col" className="py-2 pr-4">
                Org
              </th>
              <th scope="col" className="py-2 pr-4 text-right">
                BLEU
              </th>
              <th scope="col" className="py-2 pr-4 text-right">
                chrF++
              </th>
              <th scope="col" className="py-2">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedForTable.map((entry) => {
              const isExternal = !entry.href.startsWith("/");
              return (
                <tr key={entry.model} className="border-b border-black/5">
                  <td className="py-2 pr-4 text-black/80">
                    {entry.isOurs ? (
                      <span className="font-medium text-black">
                        {entry.model}
                      </span>
                    ) : (
                      entry.model
                    )}
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{entry.org}</td>
                  <td className="py-2 pr-4 text-right text-black/80 tabular-nums">
                    {entry.bleu.toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right text-black/80 tabular-nums">
                    {entry.chrf.toFixed(2)}
                  </td>
                  <td className="py-2">
                    <a
                      href={entry.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noreferrer" : undefined}
                      className="text-black/60 underline underline-offset-4 hover:text-black"
                    >
                      {isExternal ? "Source" : "Model card"}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export { BenchmarkSection };
