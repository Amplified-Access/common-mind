import Image from "next/image";

import type { LogoSize, SanityImage } from "@/lib/content/types";
import { cn } from "@/lib/utils";

// Heights for the logo sizes editors pick in the Studio.
const LOGO_SIZE_CLASS: Record<LogoSize, string> = {
  sm: "h-7",
  md: "h-10",
  lg: "h-12",
  xl: "h-20",
};

/** A logo from Sanity at its chosen size. SVGs skip Next's optimizer. */
function CmsLogo({
  image,
  size,
  alt,
  className,
}: {
  image: SanityImage;
  size: LogoSize;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      unoptimized={image.url.endsWith(".svg")}
      className={cn("w-auto", LOGO_SIZE_CLASS[size], className)}
    />
  );
}

export { CmsLogo };
