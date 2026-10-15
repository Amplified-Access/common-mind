"use client";

import { usePathname } from "next/navigation";

import { isStandalone } from "@/lib/site";

/** Renders its children everywhere except on standalone pages (lib/site.ts). */
function HideOnStandalone({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isStandalone(pathname) ? null : children;
}

export { HideOnStandalone };
