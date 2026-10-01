"use client";

import { Cancel } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { Chevron } from "@/components/system/chevron";

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

type AnnouncementBannerProps = {
  id: string;
  label: string;
  message: string;
  linkLabel: string;
  href: string;
};

function AnnouncementBanner({
  id,
  label,
  message,
  linkLabel,
  href,
}: AnnouncementBannerProps) {
  const [dismissedNow, setDismissed] = useState(false);
  const storedId = useSyncExternalStore(noopSubscribe, readDismissed, () => null);

  if (dismissedNow || storedId === id) return null;

  return (
    <div className="relative bg-foreground text-background">
      <Container className="flex items-center justify-center gap-3 py-2.5 pr-10 text-center text-xs sm:text-sm">
        <span className="hidden h-5 shrink-0 items-center justify-center rounded-full bg-signal px-2 text-xs leading-none font-medium whitespace-nowrap text-background sm:inline-flex">
          {label}
        </span>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          <span className="hidden sm:inline">{message}</span>
          <span className="sm:hidden">{label}: {message.split(":")[0]}</span>
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
          >
            {linkLabel}
            <Chevron />
          </Link>
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
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-background/50 transition-colors hover:text-background"
      >
        <HugeiconsIcon icon={Cancel} className="size-3.5" />
      </button>
    </div>
  );
}

export { AnnouncementBanner };
