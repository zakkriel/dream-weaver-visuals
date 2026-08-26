import type { CSSProperties, ElementType, ReactNode } from "react";
import type { Space } from "./Stack";

export function Inline({
  gap = 4,
  as: As = "div",
  align = "center",
  wrap = false,
  style,
  children,
  ...rest
}: {
  gap?: Space;
  as?: ElementType;
  align?: CSSProperties["alignItems"];
  wrap?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <As
      style={{
        display: "flex",
        flexDirection: "row",
        gap: `var(--dc-space-${gap})`,
        alignItems: align,
        flexWrap: wrap ? "wrap" : "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}
