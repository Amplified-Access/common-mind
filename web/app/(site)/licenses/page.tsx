import type { Metadata } from "next";
import Link from "next/link";

import { datasets } from "@/components/datasets/data";
import { LegalDocument, LegalSection } from "@/components/legal/legal-document";
import { registryModels } from "@/components/models/registry";

export const metadata: Metadata = {
  title: "Licenses",
  description: "The licenses CommonMind's models are released under, and where each dataset's terms live.",
};

const LicensesPage = () => {
  return (
    <LegalDocument title="Licenses" updated="October 2026">
      <LegalSection number={1} title="Models">
        <p>
          Each model is released under its own license, and adapters also inherit the terms of
          the base model they load.
        </p>
        <dl className="flex flex-col border-t border-line">
          {registryModels.map((model) => (
            <div key={model.slug} className="grid gap-1 border-b border-line py-4 font-mono text-[13px] sm:grid-cols-2 sm:gap-6">
              <dt>
                <Link href={`/models/${model.slug}`} className="text-foreground hover:text-signal">
                  {model.name}
                </Link>
              </dt>
              <dd>
                {model.license}
                <span className="block text-xs">
                  Base:{" "}
                  <a href={model.base.href} target="_blank" rel="noreferrer" className="hover:text-signal">
                    {model.base.id} ↗
                  </a>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection number={2} title="Datasets">
        <p>
          The datasets behind the models are published by their own maintainers, under their own
          terms. Check each publisher&apos;s page before reuse.
        </p>
        <ul className="flex flex-col border-t border-line">
          {datasets.map((dataset) => (
            <li key={dataset.slug} className="flex items-baseline justify-between gap-6 border-b border-line py-3 font-mono text-[13px]">
              <Link href={`/datasets/${dataset.slug}`} className="text-foreground hover:text-signal">
                {dataset.name}
              </Link>
              <a href={dataset.href} target="_blank" rel="noreferrer" className="shrink-0 hover:text-signal">
                {dataset.source} ↗
              </a>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection number={3} title="This Website">
        <p className="text-signal">[License for the website&apos;s code and content to be provided.]</p>
      </LegalSection>
    </LegalDocument>
  );
};

export default LicensesPage;
