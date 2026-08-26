import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}: { variant?: "primary" | "quiet" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`dc-btn dc-btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
