"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Arrow } from "@/components/system/arrow";
import type { Announcement } from "@/lib/content/types";

import { Container } from "../common/container";

const STORAGE_KEY = "cm-announcement-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: keep showing the banner.
    return null;
  }
}

const noopSubscribe = () => () => {};

// Shown on the home page only, for now. Dismissing it remembers its key,
// so a new announcement (a new key) shows again.
function AnnouncementBanner({ announcement }: { announcement: Announcement }) {
  const { key: id, message, link } = announcement;
  const pathname = usePathname();
  const [dismissedNow, setDismissed] = useState(false);
  const storedId = useSyncExternalStore(noopSubscribe, readDismissed, () => null);

  if (pathname !== "/" || dismissedNow || storedId === id) return null;

  return (
    <div className="zoom-viewport relative bg-[#0c0c0c] text-foreground">
      <Container className="flex items-center justify-center py-2.5 pr-12 text-center text-xs sm:text-[13px]">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          <span>{message}</span>
          {link && (
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 font-mono text-xs text-signal transition-colors hover:text-foreground"
            >
              {link.label}
              <Arrow direction="right" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </p>
      </Container>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, id);
          } catch {
            // Ignore: dismissal just won't persist.
          }
          setDismissed(true);
        }}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-foreground/80 transition-colors hover:text-foreground md:right-8 xl:right-12"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
      </button>
    </div>
  );
}

export { AnnouncementBanner };
