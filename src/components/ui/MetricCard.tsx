interface MetricCardProps {
  value: string;
  label: string;
  className?: string;
}

export function MetricCard({ value, label, className = "" }: MetricCardProps) {
  return (
    <div
      className={`bg-primary-fixed/30 rounded-xl px-5 py-4 ${className}`}
    >
      <div className="font-[family-name:var(--font-headline)] font-extrabold text-2xl text-primary mb-1">
        {value}
      </div>
      <div className="text-label-md text-on-surface-variant">{label}</div>
    </div>
  );
}
