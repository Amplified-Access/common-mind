import Link from "next/link";

import { LegalDocument, LegalSection } from "@/components/legal/legal-document";
import { registryModels } from "@/components/models/registry";
import { getContent } from "@/lib/content";
import { getPageCopy, pageMetadata } from "@/lib/copy";

export const generateMetadata = () => pageMetadata("licenses", "/licenses");

const LicensesPage = async () => {
  const [{ datasets }, copy] = await Promise.all([getContent(), getPageCopy("licenses")]);
  return (
    <LegalDocument title={copy.title} updated={copy.updated}>
      <LegalSection number={1} title={copy.models.title}>
        <p>{copy.models.intro}</p>
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
                  {copy.models.base}{" "}
                  <a href={model.base.href} target="_blank" rel="noreferrer" className="hover:text-signal">
                    {model.base.id} ↗
                  </a>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection number={2} title={copy.datasets.title}>
        <p>{copy.datasets.intro}</p>
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

      <LegalSection number={3} title={copy.website.title}>
        <p>{copy.website.text}</p>
        <p>
          <a
            href="https://github.com/Amplified-Access/common-mind/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-signal"
          >
            {copy.website.link} ↗
          </a>
        </p>
      </LegalSection>
    </LegalDocument>
  );
};

export default LicensesPage;
