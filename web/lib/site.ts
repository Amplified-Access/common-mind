// Navigation and the pages that stand alone.

// Pages that stand on their own, without the site header and footer: the
// Data Lab sign-in, the signed-in Data Lab app, and the logo lab. Each
// entry covers its subpaths too.
export const standalonePaths = [
  "/data-lab/sign-in",
  "/data-lab/workspace",
  "/data-lab/welcome",
  "/data-lab/contribute",
  "/data-lab/review",
  "/logo-lab",
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
  links: {
    huggingface: "https://huggingface.co/AmplifiedAccess",
  },
} as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
