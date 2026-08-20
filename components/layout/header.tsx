"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
// import { Button } from "../ui/button";

const navItems = [
  { label: "Models", href: "/models" },
  { label: "Languages", href: "/languages" },
  { label: "Datasets", href: "/datasets" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Playground", href: "/playground" },
  { label: "Build", href: "/build" },
  { label: "Research", href: "/research" },
];

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="pt-8 pb-4 bg-white">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3" size={"xl"}>
        <Link href="/" aria-label="Home">
          <Image
            src="/logo-black.svg"
            alt="Logo"
            width={1024}
            height={147}
            priority
            className="h-5 w-auto"
          />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-background",
                  active ? "text-background" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* <Button></Button> */}
      </Container>
    </header>
  );
};

export default Header;