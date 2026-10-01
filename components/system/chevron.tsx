import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

// The site's link affordance. Sized in em so it follows the surrounding text.
function Chevron({
  direction = "right",
  className,
}: {
  direction?: "left" | "right";
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={direction === "left" ? ArrowLeft01Icon : ArrowRight01Icon}
      aria-hidden
      className={cn("size-[1.1em] shrink-0", className)}
    />
  );
}

export { Chevron };
