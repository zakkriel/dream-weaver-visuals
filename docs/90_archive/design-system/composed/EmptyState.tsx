import type { ReactNode } from "react";
import { Text } from "../primitives/Text";

export function EmptyState({ children }: { children?: ReactNode }) {
  return <Text tone="muted" italic>{children}</Text>;
}
