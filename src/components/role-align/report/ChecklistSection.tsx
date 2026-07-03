"use client";

type ChecklistItem = {
  id: string;
  section: string;
  label: string;
  status: "pass" | "fail";
  priority: "high" | "medium" | "low";
  reason: string;
};

type Props = {
  title: string;
  items: ChecklistItem[];
  filterSection?: string[];
};

export function ChecklistSection({ title, items, filterSection }: Props) {
  const filtered = filterSection
    ? items.filter((i) => filterSection.includes(i.section))
    : items;

  if (!filtered.length) return null;

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
        <h3 className="text-lg font-extrabold font-[family-name:var(--font-headline)]">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-outline-variant/10">
        {filtered.map((item) => (
          <li key={item.id} className="px-6 py-4 flex gap-4 items-start">
            <span
              className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                item.status === "pass" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {item.status === "pass" ? "check_circle" : "cancel"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-bold text-on-surface">{item.label}</p>
                {item.priority === "high" && item.status === "fail" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    High impact
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
