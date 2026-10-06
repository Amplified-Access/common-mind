"use client";

import { Menu } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { isActive, navItems, site } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

// Past this scroll offset the header hides on scroll-down and reappears on
// scroll-up.
const REVEAL_THRESHOLD = 96;

const Header = () => {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLenis(({ scroll, direction }) => {
    const pastThreshold = scroll >= REVEAL_THRESHOLD;
    setScrolled(scroll > 8);
    if (!pastThreshold) {
      setHidden(false);
      return;
    }
    if (direction === 1) setHidden(true);
    else if (direction === -1) setHidden(false);
  });

  return (
    <header
      className={cn(
        "zoom-viewport sticky top-0 z-50 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden ? "-translate-y-full" : "translate-y-0",
        scrolled
          ? "bg-background/80 backdrop-blur-xl"
          : "bg-background",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="CommonMind home" className="shrink-0">
          <Image
            src="/logo-white.svg"
            alt="CommonMind"
            width={1039}
            height={184}
            priority
            className="h-5.5 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/6 text-foreground"
                    : "text-subtle hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={site.links.huggingface}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-subtle transition-colors hover:text-foreground"
          >
            Hugging Face ↗
          </a>
          <Link
            href="/build"
            className="inline-flex h-8 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
          >
            Get started
          </Link>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="cursor-pointer text-subtle transition-colors hover:text-foreground md:hidden"
          >
            <HugeiconsIcon icon={Menu} className="size-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigate</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 px-6 pt-6">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className="py-2"
                  >
                    <span
                      className={cn(
                        "text-3xl tracking-tight",
                        active ? "text-foreground" : "text-foreground/50",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col gap-3 p-6">
              <Link
                href="/build"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background"
              >
                Get started
              </Link>
              <a
                href={site.links.huggingface}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/6 text-sm"
              >
                Hugging Face ↗
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
};

export default Header;
