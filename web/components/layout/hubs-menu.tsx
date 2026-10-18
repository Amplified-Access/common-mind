"use client";

import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon, DatabaseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Arrow } from "@/components/system/arrow";
import { hubs } from "@/lib/site";

// The header's door to where the models and data are published: a ghost
// database button with a chevron, opening a short list of the hubs, each in
// a new tab.
function HubsMenu() {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Models and data"
        className="group flex h-8 cursor-pointer items-center gap-1 px-2 text-foreground transition-colors hover:text-signal data-popup-open:text-signal"
      >
        <HugeiconsIcon icon={DatabaseIcon} strokeWidth={1.75} className="size-4.5" />
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 transition-transform duration-200 group-data-popup-open:rotate-180"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="z-50">
          <Popover.Popup className="min-w-48 origin-(--transform-origin) rounded-card border border-line bg-background/90 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.45)] backdrop-blur-xl transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Popover.Title className="px-3 pt-2 pb-1.5 font-mono text-[11px] text-faint uppercase">
              Models and data
            </Popover.Title>
            <ul className="flex flex-col">
              {hubs.map((hub) => (
                <li key={hub.href}>
                  <a
                    href={hub.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-6 rounded-inset px-3 py-2.5 font-mono text-xs text-foreground transition-colors hover:bg-white/5 hover:text-signal focus-visible:bg-white/5 focus-visible:text-signal focus-visible:outline-none"
                  >
                    {hub.label}
                    <Arrow className="text-faint transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal" />
                  </a>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { HubsMenu };
