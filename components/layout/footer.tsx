import {
  Facebook01Icon,
  InstagramIcon,
  Linkedin01Icon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { FooterCta } from "@/components/layout/footer-cta";
import { isExternalHref } from "@/components/system/primitives";
import { footerColumns, partners, site, socialLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

// The partner logos scroll in an endless row: two identical runs back to
// back, and the loop slides exactly one run over. A run holds the logos
// twice, so it's wider than the strip at any width and never shows a gap.
// Hovering or focusing a logo pauses it; reduced motion shows them still.
const PARTNER_RUN = [...partners, ...partners];
const PARTNER_LOOP = [...PARTNER_RUN, ...PARTNER_RUN];
const SECONDS_PER_LOGO = 4;

const socialIcons = {
  linkedin: Linkedin01Icon,
  facebook: Facebook01Icon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
};

const Footer = () => {
  return (
    <footer className="zoom-viewport">
      {/* The last section's bottom padding sets the space above. */}
      <Container>
        <FooterCta />
      </Container>

      {/* The page settles into a line, lit from below by the call to action. */}
      <div aria-hidden className="relative h-9">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgb(255_211_0/0.07))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-line-strong" />
      </div>

      <Container className="flex flex-col gap-16 pt-12 pb-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-6">
            <Image
              src="/logo-white.svg"
              alt="CommonMind"
              width={1039}
              height={184}
              className="h-7 w-auto self-start"
            />
            <p className="max-w-xs text-sm text-pretty text-subtle">
              An open civic AI infrastructure initiative by{" "}
              <a
                href={site.org.href}
                target="_blank"
                rel="noreferrer"
                className="text-foreground/80 underline decoration-line-strong underline-offset-4 transition-colors hover:text-signal"
              >
                {site.org.name}
              </a>
              .
            </p>
            <ul className="flex gap-2.5">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-8 items-center justify-center rounded-full bg-[#191500] text-foreground transition-colors hover:bg-signal hover:text-background"
                  >
                    <HugeiconsIcon icon={socialIcons[social.id]} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
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

        <p className="text-center text-[13px] text-faint">
          © {new Date().getFullYear()} CommonMind
        </p>

        <div className="flex flex-col gap-6 rounded-card bg-[#1a1608] px-6 py-5 sm:flex-row sm:items-center sm:gap-12 sm:px-8">
          <span className="shrink-0 text-[13px] text-foreground">In collaboration with:</span>
          <div className="min-w-0 flex-1 overflow-hidden mask-[linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:mask-none">
            <ul
              className="flex w-max animate-[cm-marquee_var(--marquee-duration)_linear_infinite] items-center hover:[animation-play-state:paused] has-focus-visible:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:gap-y-5"
              style={{ "--marquee-duration": `${PARTNER_RUN.length * SECONDS_PER_LOGO}s` } as React.CSSProperties}
            >
              {PARTNER_LOOP.map((partner, i) => {
                // Only the first pass is real; the rest repeat it for the loop.
                const copy = i >= partners.length;
                const logo = (
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={partner.width}
                    height={partner.height}
                    className={cn("w-auto opacity-90 transition-opacity group-hover:opacity-100", partner.size)}
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
