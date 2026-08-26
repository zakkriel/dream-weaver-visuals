import type { ReactNode } from "react";

export function Heading({
  level = 1,
  className = "",
  children,
  ...rest
}: { level?: 1 | 2 | 3; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const Tag = (`h${level}`) as "h1" | "h2" | "h3";
  return (
    <Tag className={`dc-h dc-h--${level} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
