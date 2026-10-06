import Link from "next/link";

import { Chevron } from "@/components/system/chevron";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Section scaffolding                                                 */
/* ------------------------------------------------------------------ */

// Sections are separated by space alone, never by rules.
function Section({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("zoom-viewport scroll-mt-24 py-20 sm:py-28", className)}
      {...props}
    >
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: React.ReactNode;
  lede?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

function SectionHeader({ title, lede, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 md:flex-row md:justify-between",
        action && "md:items-end",
        className,
      )}
    >
      <div className="flex max-w-3xl flex-col gap-5">
        <h2 className="text-h2 text-balance">{title}</h2>
        {lede && (
          <p className="max-w-xl text-lg text-pretty text-subtle">{lede}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small atoms                                                         */
/* ------------------------------------------------------------------ */

function StatusDot({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs text-subtle",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-signal" />
      {label}
    </span>
  );
}

type ArrowLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
};

function ArrowLink({ href, children, className, external }: ArrowLinkProps) {
  const isExternal = external ?? /^https?:/.test(href);
  const classes = cn(
    "group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-signal",
    className,
  );
  const arrow = isExternal ? (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
      ↗
    </span>
  ) : (
    <Chevron className="transition-transform duration-300 group-hover:translate-x-0.5" />
  );
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
        {arrow}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
      {arrow}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons as links                                                    */
/* ------------------------------------------------------------------ */

function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ink" | "ink-secondary";
  className?: string;
}) {
  const isExternal = /^https?:/.test(href);
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors",
    variant === "primary" && "bg-foreground text-background hover:bg-foreground/85",
    variant === "secondary" && "bg-white/6 text-foreground hover:bg-white/10",
    // For use on the yellow surface.
    variant === "ink" && "bg-background text-foreground hover:bg-background/85",
    variant === "ink-secondary" && "bg-background/10 text-background hover:bg-background/15",
    className,
  );
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Technical metadata                                                  */
/* ------------------------------------------------------------------ */

type MetaItem = {
  label: string;
  value: React.ReactNode;
  href?: string;
};

// Label/value pairs laid out on whitespace alone.
function MetaGrid({
  items,
  className,
}: {
  items: MetaItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-2">
          <dt className="text-sm text-faint">{item.label}</dt>
          <dd className="text-sm text-foreground">
            {item.href ? (
              <a
                href={item.href}
                target={/^https?:/.test(item.href) ? "_blank" : undefined}
                rel="noreferrer"
                className="transition-colors hover:text-signal"
              >
                {item.value} ↗
              </a>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

// A quiet filled surface. No outline.
function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-3xl bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

export { ArrowLink, LinkButton, MetaGrid, Panel, Section, SectionHeader, StatusDot };
export type { MetaItem };
