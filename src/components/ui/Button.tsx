import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  icon?: string;
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", children, className = "", icon, ...rest } = props;

  const variantClasses = {
    primary:
      "cta-gradient text-on-primary font-bold hover:opacity-90 active:scale-95",
    secondary:
      "bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest",
    tertiary:
      "text-primary font-bold hover:underline underline-offset-4 bg-transparent",
    ghost:
      "text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-low bg-transparent",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
    md: "px-6 py-3 text-sm rounded-xl gap-2",
    lg: "px-8 py-4 text-base rounded-xl gap-2.5",
  };

  const baseClasses = `inline-flex items-center justify-center transition-all duration-200 font-[family-name:var(--font-headline)] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {icon && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
    </>
  );

  if (props.as === "a") {
    const { as: _, variant: _v, size: _s, icon: _i, ...linkProps } = props as ButtonAsLink;
    return (
      <a className={baseClasses} {...linkProps}>
        {content}
      </a>
    );
  }

  const { as: _, variant: _v, size: _s, icon: _i, ...buttonProps } = props as ButtonAsButton;
  return (
    <button className={baseClasses} {...buttonProps}>
      {content}
    </button>
  );
}
