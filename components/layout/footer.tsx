import Link from "next/link";

import { Button } from "@/components/ui/button";

const footerLinks = [
  { label: "Models", href: "/models" },
  { label: "Languages", href: "/languages" },
  { label: "Datasets", href: "/datasets" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Playground", href: "/playground" },
  { label: "Build", href: "/build" },
  { label: "Research", href: "/research" },
];

const Footer = () => {
  return (
    <footer className="bg-[#f4f4f4] p-4">
      <div className="flex flex-col gap-16 rounded-3xl bg-black px-8 py-16 text-white sm:px-16 sm:py-20">
        <div className="flex flex-col items-start gap-6">
          <span className="text-xs font-medium tracking-widest text-white/60 uppercase">
            Get involved
          </span>
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Help build the open foundations for inclusive AI.
          </h2>
          <p className="max-w-xl text-base text-white/70 sm:text-lg">
            CommonMind is open — the models, the data, and the research. Bring
            your language, your dataset, or your use case, and help close the
            gap.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/build" />}
            className="bg-white text-black hover:bg-white/85"
          >
            Start building →
          </Button>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} CommonMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
