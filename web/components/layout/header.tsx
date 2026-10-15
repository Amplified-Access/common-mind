"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/system/primitives";
import { isActive, isStandalone, navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

// On the home page, past this scroll offset the header lifts off the page
// into a floating bar; back above it, the header docks again. Every other
// page keeps it floating throughout.
const PIN_THRESHOLD = 80;

// Timing for the docked/floating morph.
const MORPH =
  "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const Header = () => {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLenis(({ scroll }) => {
    setPinned(scroll >= PIN_THRESHOLD);
  });
  const home = pathname === "/";
  const floating = !home || pinned;

  if (isStandalone(pathname)) return null;

  // Docked: a full-width bar, 56px tall. Floating: an 8px drop plus a 62px
  // bar, sized so the 36px logo sits 13px (1px border plus 12px) from the
  // top and bottom edges, the same as from the sides.
  return (
    <header
      className={cn(
        // Takes no room, so the page's hero runs up behind it and nothing
        // below shifts as the bar changes height.
        "zoom-viewport sticky top-0 z-50 h-0",
        // Where the page's container content starts: the container's gutter,
        // plus its centering margin once the screen outgrows it. Docked, the
        // black strip runs edge to edge and pads in by this; floating, the
        // bar draws in by it from both edges as it drops.
        "[--gutter:1rem] md:[--gutter:2rem] xl:[--gutter:3rem]",
        "[--inset:max(var(--gutter),calc((100%-90rem)/2+var(--gutter)))]",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-between gap-6 border transition-[height,margin,padding,background-color,border-color,border-radius,box-shadow,backdrop-filter]",
          MORPH,
          floating
            ? "mx-(--inset) mt-2 h-15.5 rounded-card border-line bg-background/70 px-3 shadow-[0_8px_30px_rgb(0_0_0/0.45)] backdrop-blur-xl"
            : "mx-0 mt-0 h-14 rounded-none border-transparent bg-background px-(--inset)",
        )}
      >
        <Link href="/" aria-label="CommonMind home" className="shrink-0">
          <Image
            src="/logo-white.svg"
            alt="CommonMind"
            width={138}
            height={49}
            priority
            className="h-9 w-auto"
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
                  active ? "text-signal" : "text-foreground hover:text-signal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/models"
            className={buttonClasses("outline", "max-lg:px-3.5")}
          >
            Models
          </Link>
          <Link
            href="/data-lab"
            className={buttonClasses("signal", "max-lg:px-3.5")}
          >
            Data Lab
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
                href="/data-lab"
                onClick={() => setMobileNavOpen(false)}
                className={buttonClasses("signal", "h-11")}
              >
                Data Lab
              </Link>
              <Link
                href="/models"
                onClick={() => setMobileNavOpen(false)}
                className={buttonClasses("outline", "h-11")}
              >
                Models
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
