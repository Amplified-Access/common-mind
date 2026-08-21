import Link from "next/link";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./container";

type Topic = {
  label: string;
  href?: string;
};

type Cta = {
  label: string;
  href: string;
};

type HeroProps = {
  title: string;
  tagline: string;
  topics: Topic[];
  description: string;
  ctas: Cta[];
  variant?: "dark" | "light";
};

function Hero({
  title,
  tagline,
  topics,
  description,
  ctas,
  variant = "dark",
}: HeroProps) {
  const isLight = variant === "light";

  return (
    <section className={cn("py-16 md:py-24", isLight && "bg-[#f4f4f4]")}>
      <Container>
        <h1
          className={cn(
            "text-4xl font-semibold tracking-tight text-balance md:text-6xl",
            isLight && "text-black",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mt-4 text-lg md:text-xl",
            isLight ? "text-gray-600" : "text-muted-foreground",
          )}
        >
          {tagline}
        </p>
        <div
          className={cn(
            "mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm",
            isLight ? "text-gray-500" : "text-muted-foreground",
          )}
        >
          {topics.map((topic, index) => (
            <Fragment key={topic.label}>
              {index > 0 && <span aria-hidden>·</span>}
              {topic.href ? (
                <Link
                  href={topic.href}
                  className={cn(
                    "transition-colors",
                    isLight ? "hover:text-black" : "hover:text-foreground",
                  )}
                >
                  {topic.label}
                </Link>
              ) : (
                <span>{topic.label}</span>
              )}
            </Fragment>
          ))}
        </div>
        <p
          className={cn(
            "mt-8 max-w-2xl text-base",
            isLight ? "text-black/80" : "text-foreground/80",
          )}
        >
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {ctas.map((cta, index) => (
            <Button
              key={cta.label}
              variant={index === 0 ? "default" : "outline"}
              nativeButton={false}
              render={<Link href={cta.href} />}
              className={
                isLight
                  ? index === 0
                    ? "bg-black text-white hover:bg-black/85"
                    : "border-black/15 bg-transparent text-black hover:bg-black/5"
                  : undefined
              }
            >
              {cta.label} →
            </Button>
          ))}
        </div>
      </Container>
    </section>
  );
}

export { Hero };
