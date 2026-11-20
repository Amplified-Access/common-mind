"use client";

import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Arrow } from "@/components/system/arrow";
import { buttonClasses } from "@/components/system/primitives";
import { hubs, sourceCode } from "@/lib/site";
import { cn } from "@/lib/utils";

// The header's door to where the models and data are published: a ghost
// "Repositories" button with a chevron, opening a short
// list of the hubs and the source code, each in a new tab.
const linkClass =
  "group flex items-center justify-between gap-6 rounded-inset px-3 py-2.5 font-mono text-xs text-foreground transition-colors hover:bg-white/5 hover:text-signal focus-visible:bg-white/5 focus-visible:text-signal focus-visible:outline-none";

function MenuLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {label}
      <Arrow className="text-faint transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal" />
    </a>
  );
}

const groupTitle = "px-3 pt-2 pb-1.5 font-mono text-[11px] text-faint uppercase";

function HubsMenu() {
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(buttonClasses("ghost", "text-signal"), "group cursor-pointer data-popup-open:bg-white/8")}
      >
        Repositories
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 transition-transform duration-200 group-data-popup-open:rotate-180"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="z-50">
          <Popover.Popup className="min-w-48 origin-(--transform-origin) rounded-card border border-line bg-background/90 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.45)] backdrop-blur-xl transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Popover.Title className={groupTitle}>Models and data</Popover.Title>
            <ul className="flex flex-col">
              {hubs.map((hub) => (
                <li key={hub.href}>
                  <MenuLink {...hub} />
                </li>
              ))}
            </ul>
            <p className={cn(groupTitle, "mt-1 border-t border-line pt-3")}>Source code</p>
            <MenuLink {...sourceCode} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { HubsMenu };
