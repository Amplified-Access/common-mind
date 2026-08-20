"use client";

import { ArrowUpRight, Cancel, Megaphone } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "../common/container";

const STORAGE_KEY = "cm-announcement-dismissed";

type AnnouncementBannerProps = {
  id: string;
  message: string;
  linkLabel: string;
  href: string;
};

function AnnouncementBanner({
  id,
  message,
  linkLabel,
  href,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === id) {
      setDismissed(true);
    }
  }, [id]);

  if (dismissed) return null;

  return (
    <div className="relative bg-black text-white">
      <Container
        size="xl"
        className="flex items-center justify-center gap-2 py-2.5 pr-10 text-center text-sm"
      >
        <HugeiconsIcon icon={Megaphone} className="size-4 shrink-0" />
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold">{message}</span>
          <Link
            href={href}
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            {linkLabel}
            <HugeiconsIcon icon={ArrowUpRight} className="size-3.5" />
          </Link>
        </p>
      </Container>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, id);
          setDismissed(true);
        }}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <HugeiconsIcon icon={Cancel} className="size-4" />
      </button>
    </div>
  );
}

export { AnnouncementBanner };
