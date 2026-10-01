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
  org: { name: "Amplified Access", href: "https://amplifiedaccess.org" },
  links: {
    huggingface: "https://huggingface.co/AmplifiedAccess",
    ollama: "https://ollama.com/amplifiedaccessorg",
    kaggle: "https://www.kaggle.com/gracenoble",
  },
} as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
