// Navigation and the pages that stand alone.

// Pages that stand on their own, without the site header and footer: the
// Data Lab sign-in, the signed-in Data Lab app, the logo lab and the signing
// avatar. Each entry covers its subpaths too.
export const standalonePaths = [
  "/data-lab/sign-in",
  "/data-lab/workspace",
  "/data-lab/welcome",
  "/data-lab/contribute",
  "/data-lab/review",
  "/logo-lab",
  "/sign",
];

export const isStandalone = (pathname: string) =>
  standalonePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const navItems = [
  { label: "Models", href: "/models" },
  { label: "Languages", href: "/languages" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Data Lab", href: "/data-lab" },
  { label: "Research", href: "/research" },
] as const;

// The brand name and the external destinations the code links to. The rest
// of the site's settings (description, announcement, footer, partners) are
// edited in the Studio (lib/content).
export const site = {
  name: "CommonMind",
  // The production address. Every canonical URL starts here, so previews and
  // the bare domain (which redirects here) never compete with it in search.
  url: "https://www.thecommonmind.org",
  links: {
    huggingface: "https://huggingface.co/AmplifiedAccess",
    kaggle: "https://www.kaggle.com/amplifiedaccess",
    ollama: "https://ollama.com/amplifiedaccessorg",
  },
} as const;

// Where the models and data are published, in the header's menu.
export const hubs = [
  { label: "Hugging Face", href: site.links.huggingface },
  { label: "Kaggle", href: site.links.kaggle },
  { label: "Ollama", href: site.links.ollama },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
