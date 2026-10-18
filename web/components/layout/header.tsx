"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLenis } from "lenis/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/system/primitives";
import { hubs, isActive, isStandalone, navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

import { HubsMenu } from "./hubs-menu";
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
  // bar, with the 28px logo centred in it.
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
            ? // The end pads in by what's left above and below the last item:
              // 14px around the 32px buttons, 18px around the 24px menu icon.
              "mx-(--inset) mt-2 h-15.5 rounded-card border-line bg-background/70 pr-4.5 pl-6 shadow-[0_8px_30px_rgb(0_0_0/0.45)] backdrop-blur-xl lg:pr-3.5"
            : "mx-0 mt-0 h-14 rounded-none border-transparent bg-background px-(--inset)",
        )}
      >
        <Link href="/" aria-label="CommonMind home" className="shrink-0">
          <Image
            src="/logo-white.svg"
            alt="CommonMind"
            width={225}
            height={37}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:absolute xl:left-1/2 xl:-translate-x-1/2 xl:gap-7">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-trim py-2 text-sm transition-colors",
                  active ? "text-signal" : "text-foreground hover:text-signal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <HubsMenu />
          <Link
            href="/get-started"
            className={buttonClasses("signal", "max-xl:px-3.5")}
          >
            Get Started
          </Link>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="cursor-pointer text-foreground transition-colors hover:text-signal lg:hidden"
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
                href="/get-started"
                onClick={() => setMobileNavOpen(false)}
                className={buttonClasses("signal", "h-11")}
              >
                Get Started
              </Link>
              <div className="grid grid-cols-3 gap-2">
                {hubs.map((hub) => (
                  <a
                    key={hub.href}
                    href={hub.href}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses("outline", "h-11 px-2")}
                  >
                    {hub.label}
                  </a>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
