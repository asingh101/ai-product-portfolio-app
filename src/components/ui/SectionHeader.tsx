interface SectionHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  overline,
  title,
  subtitle,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`mb-12 ${alignClass} ${className}`}>
      {overline && (
        <span className="text-label-md text-primary mb-4 inline-block">
          {overline}
        </span>
      )}
      <h2 className="text-display-md text-on-surface mb-4">{title}</h2>
      {subtitle && (
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
