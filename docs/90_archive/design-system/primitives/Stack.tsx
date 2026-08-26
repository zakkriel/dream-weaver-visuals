import type { CSSProperties, ElementType, ReactNode } from "react";

export type Space = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function Stack({
  gap = 4,
  as: As = "div",
  align,
  style,
  children,
  ...rest
}: {
  gap?: Space;
  as?: ElementType;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <As
      style={{ display: "flex", flexDirection: "column", gap: `var(--dc-space-${gap})`, alignItems: align, ...style }}
      {...rest}
    >
      {children}
    </As>
  );
}
