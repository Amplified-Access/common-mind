import { ArrowRight02Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

// The redesign's link affordance: a bold diagonal arrow for "go to", a
// straight one for "continue". Sized in em so it follows the text.
function Arrow({
  direction = "up-right",
  className,
}: {
  direction?: "up-right" | "right";
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={direction === "right" ? ArrowRight02Icon : ArrowUpRight01Icon}
      strokeWidth={2.5}
      aria-hidden
      className={cn("size-[1.15em] shrink-0", className)}
    />
  );
}

export { Arrow };
