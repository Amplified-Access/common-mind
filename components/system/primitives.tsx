import Link from "next/link";

import { Arrow } from "@/components/system/arrow";
import { cn } from "@/lib/utils";

const isExternalHref = (href: string) => /^https?:/.test(href);

/* ------------------------------------------------------------------ */
/* Section scaffolding                                                 */
/* ------------------------------------------------------------------ */

// Every section root zooms with the viewport past the 1280px baseline.
function Section({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("zoom-viewport relative scroll-mt-24 py-(--section-pad)", className)}
      {...props}
    >
      {children}
    </section>
  );
}

// The small monospaced label above a heading.
function Eyebrow({
  children,
  tone = "signal",
  uppercase = true,
  className,
}: {
  children: React.ReactNode;
  tone?: "signal" | "foreground";
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-xs",
        uppercase && "uppercase",
        tone === "signal" ? "text-signal" : "text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

type SectionHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  action?: React.ReactNode;
  /** "stack": lede under the title. "split": lede beside it from md up. */
  layout?: "stack" | "split";
  align?: "start" | "center";
  size?: "h1" | "h2" | "h3";
  className?: string;
};

function SectionHeader({
  eyebrow,
  title,
  lede,
  action,
  layout = "stack",
  align = "start",
  size = "h2",
  className,
}: SectionHeaderProps) {
  const heading = (
    <h2
      className={cn(
        size === "h1" && "text-h1",
        size === "h2" && "text-h2",
        size === "h3" && "text-h3",
        "text-balance",
      )}
    >
      {title}
    </h2>
  );

  if (layout === "split") {
    return (
      <div className={cn("grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-16", className)}>
        <div className="flex flex-col gap-3">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {heading}
        </div>
        {(lede || action) && (
          <div className="flex max-w-lg flex-col gap-6 md:pt-1">
            {lede && <p className="text-sm text-pretty text-foreground/80">{lede}</p>}
            {action}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {heading}
      {lede && (
        <p className="max-w-md text-sm text-pretty text-foreground/80">{lede}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

type ArrowLinkProps = {
  href: string;
  children: React.ReactNode;
  tone?: "signal" | "foreground" | "ink";
  arrow?: "up-right" | "right";
  className?: string;
  external?: boolean;
};

// Monospaced text link with the arrow affordance.
function ArrowLink({
  href,
  children,
  tone = "signal",
  arrow = "up-right",
  className,
  external,
}: ArrowLinkProps) {
  const isExternal = external ?? isExternalHref(href);
  const classes = cn(
    "group inline-flex items-center gap-2 font-mono text-xs transition-colors",
    tone === "signal" && "text-signal hover:text-foreground",
    tone === "foreground" && "text-foreground hover:text-signal",
    tone === "ink" && "text-background hover:text-background/70",
    className,
  );
  const content = (
    <>
      {children}
      <Arrow
        direction={arrow}
        className={cn(
          "transition-transform duration-300",
          arrow === "right"
            ? "group-hover:translate-x-0.5"
            : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
        )}
      />
    </>
  );
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons as links                                                    */
/* ------------------------------------------------------------------ */

type ButtonVariant = "signal" | "outline" | "ink" | "bright" | "cream";

const buttonVariants: Record<ButtonVariant, string> = {
  // Pills: header and toolbars.
  signal: "h-8 rounded-full bg-signal px-5 text-background hover:bg-signal/85",
  outline:
    "h-8 rounded-full border border-signal px-5 text-signal hover:bg-signal hover:text-background",
  cream: "h-10 rounded-full bg-foreground px-5 text-background hover:bg-foreground/85",
  // Blocks: for use on the yellow call to action.
  ink: "h-10 bg-background px-6 text-signal hover:bg-background/85",
  bright: "h-10 bg-signal px-6 text-background shadow-sm hover:bg-signal/85",
};

function buttonClasses(variant: ButtonVariant = "signal", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-mono text-xs whitespace-nowrap transition-colors",
    buttonVariants[variant],
    className,
  );
}

function LinkButton({
  href,
  children,
  variant = "signal",
  arrow,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
}) {
  const classes = buttonClasses(variant, className);
  const content = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  );
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Small atoms                                                         */
/* ------------------------------------------------------------------ */

function StatusDot({
  label,
  tone = "signal",
  className,
}: {
  label: string;
  tone?: "signal" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs text-subtle",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          tone === "signal" ? "bg-signal" : "bg-white/25",
        )}
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

// The outlined near-black card the redesign is built from.
function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  ArrowLink,
  buttonClasses,
  Eyebrow,
  isExternalHref,
  LinkButton,
  Panel,
  Section,
  SectionHeader,
  StatusDot,
};
export type { ButtonVariant };
