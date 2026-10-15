import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** "‹ Data Lab": a way back, by default to the Data Lab's public page. */
function BackLink({
  href = "/data-lab",
  label = "Data Lab",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1 font-mono text-xs leading-none text-signal transition-colors hover:text-foreground",
        className,
      )}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        className="size-4 transition-transform group-hover:-translate-x-0.5"
      />
      {label}
    </Link>
  );
}

export { BackLink };
