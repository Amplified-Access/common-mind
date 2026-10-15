import { PortableText, type PortableTextBlock, type PortableTextComponents } from "next-sanity";
import Link from "next/link";

import { LegalSection, LegalSubheading } from "./legal-document";

// A legal page's rich text (sanity/schemaTypes/legalPage.ts), drawn with the
// legal page's own pieces.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h3: ({ children }) => <LegalSubheading>{children}</LegalSubheading>,
  },
  list: {
    bullet: ({ children }) => <ul className="flex flex-col gap-0.5 pl-6">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="relative before:absolute before:top-[0.6em] before:-left-4 before:size-1 before:bg-faint">
        {children}
      </li>
    ),
  },
  marks: {
    bright: ({ children }) => <span className="text-foreground">{children}</span>,
    // Details still to be confirmed: yellow until they are.
    pending: ({ children }) => <span className="text-signal">{children}</span>,
    code: ({ children }) => <span className="font-mono">{children}</span>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      const className = "text-foreground underline underline-offset-4 hover:text-signal";
      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link href={href} className={className}>
            {children}
          </Link>
        );
      }
      // Another site opens in a new tab; mailto: and tel: open as usual.
      const web = /^https?:/.test(href);
      return (
        <a href={href} className={className} {...(web && { target: "_blank", rel: "noreferrer" })}>
          {children}
        </a>
      );
    },
  },
};

/** Rich text without sections: the closing note. */
function LegalText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}

/**
 * The body: a numbered section for each "Section heading" and what follows
 * it. Text before the first heading leads in, unnumbered.
 */
function LegalBody({ value }: { value: PortableTextBlock[] }) {
  const lead: PortableTextBlock[] = [];
  const sections: { title: string; blocks: PortableTextBlock[] }[] = [];
  for (const block of value) {
    if (block.style === "h2") {
      const title = (block.children ?? [])
        .map((child) => ("text" in child ? String(child.text) : ""))
        .join("");
      sections.push({ title, blocks: [] });
    } else {
      (sections.at(-1)?.blocks ?? lead).push(block);
    }
  }
  return (
    <>
      {lead.length > 0 && (
        <div className="flex flex-col gap-5 text-sm text-pretty text-faint">
          <LegalText value={lead} />
        </div>
      )}
      {sections.map((section, i) => (
        <LegalSection key={i} number={i + 1} title={section.title}>
          <LegalText value={section.blocks} />
        </LegalSection>
      ))}
    </>
  );
}

export { LegalBody, LegalText };
