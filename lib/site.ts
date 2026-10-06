// Single source of truth for navigation and external destinations.

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
  footer:
    "Open civic AI infrastructure for understanding how communities actually speak across languages beyond the mainstream.",
  org: { name: "Amplified Access", href: "https://amplifiedaccess.org" },
  links: {
    huggingface: "https://huggingface.co/AmplifiedAccess",
    ollama: "https://ollama.com/amplifiedaccessorg",
    kaggle: "https://www.kaggle.com/gracenoble",
    watchtower: "https://thewatchtower.tech",
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

// Placeholder profiles: replace each href with the real account URL.
export const socialLinks = [
  { id: "linkedin", label: "LinkedIn", href: "#" },
  { id: "facebook", label: "Facebook", href: "#" },
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "youtube", label: "YouTube", href: "#" },
] as const;

export const partners = [
  {
    name: "Amplified Access",
    href: site.org.href,
    logo: "/partners/amplified-access-white.svg",
    width: 574,
    height: 138,
  },
  {
    name: "WatchTower",
    href: site.links.watchtower,
    logo: "/partners/watchtower-white.svg",
    width: 219,
    height: 37,
  },
] as const;

export type FooterLink = { label: string; href: string };

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
      { label: "Terminology", href: "/research/civic-corpus#terminology" },
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
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Licenses", href: "/licenses" },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
