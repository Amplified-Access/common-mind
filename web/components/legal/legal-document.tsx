import { Container } from "@/components/common/container";
import { Backdrop } from "@/components/system/backdrop";

// A long-form legal page: a quiet hero with the title and revision date,
// then numbered sections in a single reading column.
function LegalDocument({
  title,
  updated,
  children,
  closing,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
  closing?: React.ReactNode;
}) {
  return (
    <>
      <section className="zoom-viewport relative isolate overflow-hidden border-b border-line pt-(--header-height)">
        <Backdrop wash grain stars sideGrids />
        <Container className="flex flex-col items-center gap-5 py-24 text-center sm:py-32">
          <h1 className="text-h2">{title}</h1>
          <p className="font-mono text-base text-signal sm:text-lg">Last updated: {updated}</p>
        </Container>
      </section>
      <section className="zoom-viewport relative isolate py-20 sm:py-24">
        <Backdrop stars />
        <Container size="sm" className="flex max-w-xl flex-col gap-16">
          <div className="flex flex-col gap-16">{children}</div>
          {closing && (
            <div className="flex flex-col gap-5 border-t border-foreground/80 pt-6 text-sm text-foreground">
              {closing}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-[1.75rem] leading-tight tracking-[-0.01em]">
        {number}. {title}
      </h2>
      <div className="flex flex-col gap-5 text-sm text-pretty text-faint">{children}</div>
    </section>
  );
}

function LegalSubheading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-1 text-sm font-semibold text-foreground">{children}</h3>;
}

export { LegalDocument, LegalSection, LegalSubheading };
