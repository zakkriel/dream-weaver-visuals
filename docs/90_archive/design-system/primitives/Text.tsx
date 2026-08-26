import type { ElementType, ReactNode } from "react";

export function Text({
  tone = "default",
  italic = false,
  size = "md",
  as: As = "p",
  className = "",
  children,
  ...rest
}: {
  tone?: "default" | "muted";
  italic?: boolean;
  size?: "sm" | "md";
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const cls = [
    "dc-text",
    size === "sm" && "dc-text--sm",
    tone === "muted" && "dc-text--muted",
    italic && "dc-text--italic",
    className,
  ].filter(Boolean).join(" ");
  return <As className={cls} {...rest}>{children}</As>;
}
