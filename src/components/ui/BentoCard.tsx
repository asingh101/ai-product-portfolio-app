import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  variant?: "lowest" | "low" | "container" | "gradient";
  hover?: boolean;
  as?: "div" | "a" | "article";
  href?: string;
}

export function BentoCard({
  children,
  className = "",
  variant = "lowest",
  hover = true,
  as: Component = "div",
  href,
}: BentoCardProps) {
  const bgMap = {
    lowest: "bg-surface-container-lowest",
    low: "bg-surface-container-low",
    container: "bg-surface-container",
    gradient: "cta-gradient text-on-primary",
  };

  const hoverClass = hover
    ? "hover:scale-[1.005] active:scale-[0.995] transition-transform duration-300"
    : "";

  const props = {
    className: `rounded-2xl p-8 ${bgMap[variant]} ${hoverClass} ${className}`.trim(),
    ...(Component === "a" ? { href } : {}),
  };

  return <Component {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</Component>;
}
