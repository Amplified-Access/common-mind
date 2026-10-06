import { Container } from "@/components/common/container";
import { Grainient } from "@/components/system/grainient";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  variant?: "default" | "gradient";
  className?: string;
};

// Title first, one line of context at most, and room to breathe.
function PageHero({ title, lede, actions, aside, variant = "default", className }: PageHeroProps) {
  if (variant === "gradient") {
    return (
      <section className={cn("zoom-viewport relative", className)}>
        <Container className="pt-8 pb-8 sm:pt-12 sm:pb-12">
          <div className="relative overflow-hidden rounded-3xl bg-surface-2">
            <Grainient
              className="absolute! inset-0"
              colors={["#55555a", "#2a2a2e", "#131315"]}
              blendAngle={-25}
              contrast={1.05}
              grainAmount={0.07}
            />
            <div className="relative flex min-h-96 flex-col items-center justify-center gap-8 px-8 py-20 text-center sm:min-h-112 sm:px-14">
              <h1 className="text-h1 max-w-4xl text-balance">{title}</h1>
              {lede && (
                <p className="max-w-xl text-lg text-pretty text-subtle sm:text-xl">
                  {lede}
                </p>
              )}
              {actions && (
                <div className="flex flex-wrap justify-center gap-3 pt-2">{actions}</div>
              )}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className={cn("zoom-viewport relative", className)}>
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
