// Single source of truth for navigation and external destinations.

// Pages that stand on their own, without the site header and footer.
export const standalonePaths = ["/data-lab/sign-in"];

export const isStandalone = (pathname: string) => standalonePaths.includes(pathname);

export const navItems = [
  { label: "Models", href: "/models" },
  { label: "Languages", href: "/languages" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Build", href: "/build" },
  { label: "Research", href: "/research" },
] as const;

export const site = {
  name: "CommonMind",
  statement: "Open infrastructure for multilingual AI.",
  tagline:
    "Building the open AI infrastructure for civic speech, in languages beyond the mainstream.",
  description:
    "CommonMind is an open AI infrastructure platform for building, evaluating, and deploying AI that understands civic speech, community reporting, and public discourse across languages beyond the mainstream.",
  short:
    "Open models, corpora, benchmarks, and tools for understanding civic speech in languages beyond the mainstream.",
  org: { name: "Amplified Access", href: "https://amplifiedaccess.org" },
  links: {
    huggingface: "https://huggingface.co/AmplifiedAccess",
    ollama: "https://ollama.com/amplifiedaccessorg",
    kaggle: "https://www.kaggle.com/amplifiedaccess/models",
    watchtower: "https://thewatchtower.tech",
    actionchallenge: "https://www.theactionchallenge.org",
  },
} as const;

// The site-wide announcement. Changing `id` shows it again to people who
// dismissed the previous one.
export const announcement = {
  id: "civicbench-africa-2026-10",
  message: "Introducing CivicBench Africa.",
  linkLabel: "View CivicBench",
  href: "/benchmarks#civicbench",
} as const;

export type Partner = {
  name: string;
  /** Left out where we have no site to link to. */
  href?: string;
  logo: string;
  width: number;
  height: number;
  /** Logo height class, tuned so the marks read at a similar weight. */
  size: string;
};

// The projects CommonMind powers or partners with, shown in the footer.
export const partners: Partner[] = [
  {
    name: "ActionChallenge",
    href: site.links.actionchallenge,
    logo: "/partners/action-challenge.svg",
    width: 154,
    height: 107,
    size: "h-12",
  },
  {
    name: "WatchTower",
    href: site.links.watchtower,
    logo: "/partners/watchtower-white.svg",
    width: 219,
    height: 37,
    size: "h-7",
  },
];

export type FooterLink = { label: string; href: string };

export const legalLinks: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Licenses", href: "/licenses" },
];

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  { title: "Platform", links: [...navItems] },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/build" },
      { label: "Hugging Face", href: site.links.huggingface },
      { label: "Ollama", href: site.links.ollama },
      { label: "Kaggle", href: site.links.kaggle },
      { label: "CivicBench Africa", href: "/benchmarks#civicbench" },
      { label: "Civic Speech Corpus", href: "/research/civic-corpus" },
      { label: "Datasets", href: "/datasets" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Get Started", href: "/build" },
      { label: "API", href: "/build#api" },
      { label: "Model Registry", href: "/models#registry" },
      { label: "Deployment", href: "/build#paths" },
      { label: "Releases", href: "/research#releases" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "https://amplifiedaccess.org/contact-us" },
      ...legalLinks,
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
