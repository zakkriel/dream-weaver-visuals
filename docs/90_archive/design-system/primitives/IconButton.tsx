import type { ButtonHTMLAttributes } from "react";

export function IconButton({
  label,
  type = "button",
  className = "",
  children,
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} aria-label={label} className={`dc-iconbtn ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
