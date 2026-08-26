import { Panel } from "../primitives/Panel";
import { Text } from "../primitives/Text";

/**
 * Single not-found state. No props: withheld and nonexistent both arrive identically (404), so there
 * is nothing to distinguish and the FE must not imply it can. Renders inside the shell's main slot —
 * a reader who lands here keeps their navigation.
 */
export function NotFound() {
  return (
    <Panel>
      <Text>Not found.</Text>
    </Panel>
  );
}
