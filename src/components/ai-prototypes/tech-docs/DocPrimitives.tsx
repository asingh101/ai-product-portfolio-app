import type { ReactNode } from "react";

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 mb-16">
      <h2 className="text-2xl md:text-3xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter mb-6 pb-3 border-b-2 border-primary text-primary">
        {title}
      </h2>
      <div className="prose-doc space-y-4 text-on-surface-variant leading-relaxed">{children}</div>
    </section>
  );
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/15 my-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-high text-left">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {rows.map((row, i) => (
            <tr key={i} className="bg-surface-container-lowest even:bg-surface-container-low/30">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-on-surface-variant align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocCallout({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-6 pl-5 py-4 pr-4 border-l-4 border-primary bg-primary-fixed/40 rounded-r-2xl text-on-surface text-base md:text-lg italic leading-relaxed">
      {children}
    </blockquote>
  );
}

export function DocDiagram({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="my-8 rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-4 md:p-6 overflow-x-auto">
      <figcaption className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        {title}
      </figcaption>
      {children}
    </figure>
  );
}

export function DocCode({ children }: { children: string }) {
  return (
    <pre className="my-4 p-4 rounded-xl bg-surface-container text-xs md:text-sm font-mono text-on-surface overflow-x-auto border border-outline-variant/15">
      {children}
    </pre>
  );
}

export function DocStatusBadge({
  variant,
  children,
}: {
  variant: "live" | "warning" | "neutral";
  children: ReactNode;
}) {
  if (variant === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
        <span className="material-symbols-outlined text-[18px] leading-none text-emerald-600">check_circle</span>
        {children}
      </span>
    );
  }
  if (variant === "warning") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
        <span className="material-symbols-outlined text-[18px] leading-none text-amber-600">warning</span>
        {children}
      </span>
    );
  }
  return <span className="font-medium text-on-surface-variant">{children}</span>;
}

export function StatGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 my-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 text-center"
        >
          <p className="text-2xl md:text-3xl font-extrabold font-[family-name:var(--font-headline)] text-primary">
            {item.value}
          </p>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-1">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
