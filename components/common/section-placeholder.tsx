import { Container } from "./container";

type SectionPlaceholderProps = {
  id: string;
  title: string;
};

function SectionPlaceholder({ id, title }: SectionPlaceholderProps) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-16">
      <Container>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">Coming soon.</p>
      </Container>
    </section>
  );
}

export { SectionPlaceholder };
