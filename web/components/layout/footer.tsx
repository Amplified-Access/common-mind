import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { FooterCta } from "@/components/layout/footer-cta";
import { CmsLogo } from "@/components/system/cms-logo";
import { isExternalHref } from "@/components/system/primitives";
import { getContent } from "@/lib/content";
import { cn } from "@/lib/utils";

// The partner logos scroll in an endless row: two identical runs back to
// back, and the loop slides exactly one run over. A run repeats the logos
// until it holds at least a dozen, so it's wider than the strip at any
// width and never shows a gap. Hovering or focusing a logo pauses it;
// reduced motion shows them still.
const SECONDS_PER_LOGO = 4;

const Footer = async () => {
  const { settings } = await getContent();
  const { partners, footerColumns, legalLinks, organization } = settings;
  const PARTNER_RUN = partners.length
    ? Array.from({ length: Math.ceil(12 / partners.length) }, () => partners).flat()
    : [];
  const PARTNER_LOOP = [...PARTNER_RUN, ...PARTNER_RUN];

  return (
    <footer className="zoom-viewport">
      {/* The last section's bottom padding sets the space above. */}
      <Container className="flex flex-col gap-10">
        <FooterCta />
        <div className="flex flex-col gap-6 rounded-card bg-[#1a1608] px-6 py-5 sm:flex-row sm:items-center sm:gap-12 sm:px-8">
          <span className="shrink-0 text-[13px] text-foreground">Powering:</span>
          <div className="min-w-0 flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:mask-none">
            <ul
              className="flex w-max animate-[cm-marquee_var(--marquee-duration)_linear_infinite] items-center hover:[animation-play-state:paused] has-focus-visible:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:gap-y-5"
              style={{ "--marquee-duration": `${PARTNER_RUN.length * SECONDS_PER_LOGO}s` } as React.CSSProperties}
            >
              {PARTNER_LOOP.map((partner, i) => {
                // Only the first pass is real; the rest repeat it for the loop.
                const copy = i >= partners.length;
                const logo = (
                  <CmsLogo
                    image={partner.logo}
                    size={partner.logoSize}
                    alt={partner.name}
                    className="opacity-90 transition-opacity group-hover:opacity-100"
                  />
                );
                return (
                  <li
                    key={`${partner.name}-${i}`}
                    aria-hidden={copy || undefined}
                    inert={copy}
                    className={cn("shrink-0 pr-12", copy && "motion-reduce:hidden")}
                  >
                    {partner.href ? (
                      <a
                        href={partner.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group block"
                      >
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>

      {/* The page settles into a line, lit from below by the call to action. */}
      <div aria-hidden className="relative h-9">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgb(255_211_0/0.07))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-line-strong" />
      </div>

      <Container className="flex flex-col gap-16 pt-12 pb-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-6">
            <Image
              src="/logo-white.svg"
              alt="CommonMind"
              width={138}
              height={49}
              className="h-10 w-auto self-start"
            />
            <p className="max-w-xs text-sm text-pretty text-subtle">
              An open civic AI infrastructure initiative by{" "}
              <a
                href={organization.href}
                target="_blank"
                rel="noreferrer"
                className="text-foreground/80 underline decoration-line-strong underline-offset-4 transition-colors hover:text-signal"
              >
                {organization.name}
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:flex sm:justify-between">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <span className="text-[13px] text-foreground">{column.title}</span>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-faint">© {new Date().getFullYear()} CommonMind</p>
          <ul className="flex gap-6">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

      </Container>
    </footer>
  );
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "font-mono text-[13px] text-faint transition-colors hover:text-signal";
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default Footer;
