import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";

export function MetaPanel({ title, children }: { title: string; children?: ReactNode }) {
  return <Panel title={title} raised>{children}</Panel>;
}
