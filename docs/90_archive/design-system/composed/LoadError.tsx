import { Panel } from "../primitives/Panel";
import { Text } from "../primitives/Text";

/**
 * Generic load failure (non-404, including a `schema_version` this client cannot read). Distinct from
 * NotFound so an outage never reads as "this does not exist". Renders inside the shell's main slot.
 */
export function LoadError() {
  return (
    <Panel>
      <Text>Could not load this page.</Text>
    </Panel>
  );
}
