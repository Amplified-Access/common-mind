"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type SideNavItem = { id: string; label: string };

// A sticky table of contents that follows the reader: the section in view
// is marked in yellow, with a rule running out to the CommonMind mark.
function SideNav({ items, className }: { items: SideNavItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className={cn("rounded-card border border-line bg-surface/80 px-7 py-6 backdrop-blur", className)}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={selected ? "location" : undefined}
                className={cn(
                  "flex items-center gap-1 text-lg transition-colors",
                  selected ? "text-signal" : "text-foreground hover:text-signal",
                )}
              >
                <span className="shrink-0">{item.label}</span>
                {selected && (
                  <>
                    <span aria-hidden className="ml-1 size-1 shrink-0 rounded-full bg-signal" />
                    <span aria-hidden className="h-px flex-1 bg-signal/70" />
                    <span
                      aria-hidden
                      className="size-4 shrink-0 bg-signal mask-[url(/icon-white.svg)] mask-contain mask-center mask-no-repeat"
                    />
                  </>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { SideNav };
