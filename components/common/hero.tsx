import Link from "next/link";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";

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
};

function Hero({ title, tagline, topics, description, ctas }: HeroProps) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          {tagline}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {topics.map((topic, index) => (
            <Fragment key={topic.label}>
              {index > 0 && <span aria-hidden>·</span>}
              {topic.href ? (
                <Link
                  href={topic.href}
                  className="transition-colors hover:text-foreground"
                >
                  {topic.label}
                </Link>
              ) : (
                <span>{topic.label}</span>
              )}
            </Fragment>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-base text-foreground/80">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {ctas.map((cta, index) => (
            <Button
              key={cta.label}
              variant={index === 0 ? "default" : "outline"}
              nativeButton={false}
              render={<Link href={cta.href} />}
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
