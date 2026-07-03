interface ChipProps {
  children: string;
  variant?: "selection" | "filter" | "outline";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  children,
  variant = "filter",
  active = false,
  onClick,
  className = "",
}: ChipProps) {
  const variantClasses = {
    selection: active
      ? "bg-primary-fixed text-on-primary-fixed font-bold"
      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
    filter: active
      ? "bg-primary text-on-primary font-bold"
      : "bg-surface-container-highest text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed",
    outline:
      "bg-transparent text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-[family-name:var(--font-headline)] font-medium transition-colors duration-200 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
