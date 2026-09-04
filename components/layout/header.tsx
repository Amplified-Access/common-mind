"use client";

import { Menu } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useLenis(({ scroll, direction }) => {
    const pastThreshold = scroll >= REVEAL_THRESHOLD;
    setScrolled(pastThreshold);
    if (!pastThreshold) {
      setHidden(false);
      return;
    }
    if (direction === 1) setHidden(true);
    else if (direction === -1) setHidden(false);
  });

  // The header is `sticky`, so its own box still occupies flow space — when
  // pb-7 toggles, the document's total scroll height changes too. Lenis only
  // measures that on mount/window-resize, so without this it caps scroll a
  // padding's worth short of the real bottom whenever this padding is added
  // after the initial measurement.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => lenis?.resize());
    observer.observe(el, { box: "border-box" });
    return () => observer.disconnect();
  }, [lenis]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 bg-[#f4f4f4] pt-8 transition-all duration-300 ease-in-out",
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
        <nav className="hidden flex-wrap items-center gap-x-5 gap-y-2 md:flex">
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
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="text-muted transition-colors hover:text-background md:hidden"
          >
            <HugeiconsIcon icon={Menu} className="size-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 hover:text-black",
                      active ? "bg-black/5 text-black" : "text-black/60",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
};

export default Header;
