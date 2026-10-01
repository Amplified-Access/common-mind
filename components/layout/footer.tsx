import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { FooterCta } from "@/components/layout/footer-cta";
import { navItems, site } from "@/lib/site";

const resourceLinks = [
  { label: "Hugging Face", href: site.links.huggingface },
  { label: "Ollama", href: site.links.ollama },
  { label: "Kaggle", href: site.links.kaggle },
];

const researchLinks = [
  { label: "Civic corpus", href: "/research/civic-corpus" },
  { label: "Datasets", href: "/research#datasets" },
  { label: "Methodology", href: "/benchmarks#methodology" },
];

const Footer = () => {
  return (
    <footer>
      <Container className="flex flex-col gap-20 pt-20 pb-16 sm:pt-28">
        <FooterCta />

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Image
              src="/logo-white.svg"
              alt="CommonMind"
              width={1024}
              height={147}
              className="h-4 w-auto self-start"
            />
            <p className="max-w-xs text-sm text-subtle">
              An open civic AI infrastructure initiative by{" "}
              <a
                href={site.org.href}
                target="_blank"
                rel="noreferrer"
                className="text-foreground/80 underline decoration-line-strong underline-offset-4 hover:text-foreground"
              >
                {site.org.name}
              </a>
              .
            </p>
          </div>

          <FooterColumn title="Platform">
            {navItems.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Research">
            {researchLinks.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Open resources">
            {resourceLinks.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label} ↗
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <span className="text-sm text-faint">
          © {new Date().getFullYear()} CommonMind
        </span>
      </Container>
    </footer>
  );
};

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm text-faint">{title}</span>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const external = /^https?:/.test(href);
  const className = "text-sm text-subtle transition-colors hover:text-foreground";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {children}
        </a>
      ) : (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    </li>
  );
}

export default Footer;
