import { Panel } from "../primitives/Panel";
import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { Icon } from "../primitives/Icon";
import { SourceLine, type Decay } from "../catalog/epistemic";
import { EmptyState } from "./EmptyState";

export type KnowledgeItem = {
  perception_id: string;
  content: string;
  epistemic_type: string;
  display_label: string | null;
  decay: Decay & Record<string, unknown>;
};
/**
 * One group of Collected Knowledge, as the page projections send it.
 *
 * Groups are keyed by **about-ness**: `group_key` is `subject:<entity uuid>` — the thing the group is
 * about — never a source event and never a moment. A record about several things is filed under
 * exactly one of them upstream, so nothing is ever printed twice.
 *
 * The group whose subject is the page's own entity is the **remainder** — what is known about the
 * page's subject and nothing else nameable. It arrives FIRST with a **null `group_label`**, and a null
 * label is the payload's way of saying "no heading": its items belong directly under Collected
 * Knowledge. Headed groups follow, ordered by recurrence then recency, and items inside a group stay
 * in in-world chronological order so a topic reads as it evolved.
 *
 * All of that ordering is the backend's, and this renders it in the order given (D-7). Do not sort,
 * do not merge, and do not synthesise a heading for the remainder — a heading-less block is only
 * unambiguous while it is first, which is exactly why the contract puts it there.
 */
export type KnowledgeGroup = {
  group_key: string;
  group_label: string | null;
  items: KnowledgeItem[];
};

export function KnowledgeList({ groups, emptyMessage }: { groups: KnowledgeGroup[]; emptyMessage: string }) {
  const hasKnowledge = groups.some((g) => (g.items ?? []).length > 0);
  return (
    <Panel title="Collected knowledge">
      {!hasKnowledge && <EmptyState>{emptyMessage}</EmptyState>}
      {groups.map((g) => (
        <div key={g.group_key}>
          {g.group_label && <Heading level={3}>{g.group_label}</Heading>}
          <ul className="dc-knowledge">
            {(g.items ?? []).map((it) => (
              <li key={it.perception_id} className="dc-knowledge__item">
                <span className="dc-knowledge__gem"><Icon name="gem" size={14} /></span>
                <div>
                  <Text>{it.content}</Text>
                  <SourceLine
                    kind={it.epistemic_type}
                    time={it.display_label}
                    decay={it.decay}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Panel>
  );
}
