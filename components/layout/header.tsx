"use client";

import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

// Header height in px; scrolling downward past this stops being treated as
// "near the top", so the reveal-on-scroll-up behavior only kicks in once the
// header would otherwise have scrolled out of view anyway.
const REVEAL_THRESHOLD = 96;

const Header = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useLenis(({ scroll, direction }) => {
    setScrolled(scroll > 0);
    if (scroll < REVEAL_THRESHOLD) {
      setHidden(false);
      return;
    }
    if (direction === 1) setHidden(true);
    else if (direction === -1) setHidden(false);
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white pt-8 transition-all duration-300 ease-in-out",
        hidden ? "-translate-y-full" : "translate-y-0",
        (!isHome || scrolled) && "pb-7",
      )}
    >
      <Container
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
        size={"xl"}
      >
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
