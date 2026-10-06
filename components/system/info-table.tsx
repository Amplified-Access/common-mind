import { cn } from "@/lib/utils";

export type InfoRow = {
  label: string;
  /** Missing values render as a dash, so the gap stays visible. */
  value?: React.ReactNode;
};

type InfoTableProps = {
  title?: string;
  rows: InfoRow[];
  /** Hairlines between rows, as on the model information card. */
  ruled?: boolean;
  footer?: React.ReactNode;
  className?: string;
};

// A titled card of label/value pairs: model information, training details,
// dataset information.
function InfoTable({ title, rows, ruled = false, footer, className }: InfoTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      {title && (
        <h3 className="border-b border-line px-6 py-4 font-mono text-base tracking-wide sm:px-10 sm:text-lg">
          {title}
        </h3>
      )}
      <dl className={cn("flex flex-col", !ruled && "gap-2 py-5")}>
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 px-6 font-mono text-sm sm:px-10",
              ruled ? "border-b border-line py-3 last:border-b-0" : "py-1",
            )}
          >
            <dt className="text-foreground/90">{row.label}</dt>
            <dd className="text-faint">{row.value ?? "–"}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="px-6 pb-6 sm:px-10">{footer}</div>}
    </div>
  );
}

export { InfoTable };
