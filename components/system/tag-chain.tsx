import { cn } from "@/lib/utils";

type TagChainProps = {
  tags: string[];
  /** "dark" on the site's black surfaces; "ink" on the colored cards. */
  tone?: "dark" | "ink";
  size?: "sm" | "md";
  uppercase?: boolean;
  className?: string;
};

// Boxed monospaced tags joined by a short connector, read left to right as
// one description: language, task, kind.
function TagChain({
  tags,
  tone = "dark",
  size = "md",
  uppercase = false,
  className,
}: TagChainProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-y-2", className)}>
      {tags.map((tag, i) => (
        <li key={`${tag}-${i}`} className="flex items-center">
          {i > 0 && (
            <span
              aria-hidden
              className={cn(
                "relative h-px w-5",
                tone === "ink" ? "bg-background/60" : "bg-line-strong",
              )}
            >
              {/* Centered on the previous tag's right edge: on its 1px
                  border's midline for the outlined tags, on the edge itself
                  for the borderless ink ones. */}
              <span
                className={cn(
                  "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  tone === "ink" ? "left-0 bg-background/70" : "left-[-0.5px] bg-line-strong",
                )}
              />
            </span>
          )}
          <span
            className={cn(
              "font-mono whitespace-nowrap",
              uppercase && "uppercase",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-sm",
              tone === "ink"
                ? "bg-background text-foreground"
                : "border border-line-strong bg-tag text-foreground/85",
            )}
          >
            {tag}
          </span>
        </li>
      ))}
    </ul>
  );
}

export { TagChain };
