"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/system/primitives";
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

// Past this scroll offset the header lifts off the page into a floating
// pill; back above it, the header docks again.
const PIN_THRESHOLD = 80;

// Shared by the bar and its wrapper so both halves of the morph move together.
const MORPH = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const Header = () => {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLenis(({ scroll }) => {
    setPinned(scroll >= PIN_THRESHOLD);
  });

  // Docked: a full-width bar, 56px tall. Pinned: an 8px drop plus a 48px
  // pill, still 56px, so the page below never shifts during the morph.
  return (
    <header
      className={cn(
        "zoom-viewport sticky top-0 z-50 transition-[background-color,padding]",
        MORPH,
        pinned ? "bg-transparent pt-2" : "bg-background",
      )}
    >
      <Container>
        <div
          className={cn(
            "relative flex items-center justify-between gap-6 border transition-[height,padding,background-color,border-color,border-radius,box-shadow]",
            MORPH,
            pinned
              ? "h-12 rounded-lg border-line bg-background/70 px-3 shadow-[0_8px_30px_rgb(0_0_0/0.45)] backdrop-blur-xl"
              : "h-14 rounded-none border-transparent px-0",
          )}
        >
          <Link href="/" aria-label="CommonMind home" className="shrink-0">
            <Image
              src="/logo-white.svg"
              alt="CommonMind"
              width={1039}
              height={184}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-7">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "py-1.5 text-xs transition-colors",
                    active
                      ? "text-signal"
                      : "text-foreground hover:text-signal",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={site.links.huggingface}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses("outline", "max-lg:px-3.5")}
            >
              Hugging Face
            </a>
            <Link href="/build" className={buttonClasses("signal", "max-lg:px-3.5")}>
              Get Started
            </Link>
          </div>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="cursor-pointer text-foreground transition-colors hover:text-signal md:hidden"
            >
              <HugeiconsIcon icon={Menu01Icon} className="size-6" />
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
                          active ? "text-signal" : "text-foreground/60",
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
                  className={buttonClasses("signal", "h-11")}
                >
                  Get Started
                </Link>
                <a
                  href={site.links.huggingface}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("outline", "h-11")}
                >
                  Hugging Face
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
};

export default Header;
