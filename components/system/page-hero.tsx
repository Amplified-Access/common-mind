import { Container } from "@/components/common/container";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
};

// Title first, one line of context at most, and room to breathe.
function PageHero({ title, lede, actions, aside, className }: PageHeroProps) {
  return (
    <section className={cn("relative", className)}>
      <Container
        className={cn(
          "grid gap-16 pt-20 pb-8 sm:pt-28 sm:pb-12",
          aside && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-24",
        )}
      >
        <div className="flex flex-col gap-8">
          <h1 className="text-h1 max-w-4xl text-balance">{title}</h1>
          {lede && (
            <p className="max-w-xl text-lg text-pretty text-subtle sm:text-xl">
              {lede}
            </p>
          )}
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </Container>
    </section>
  );
}

export { PageHero };
