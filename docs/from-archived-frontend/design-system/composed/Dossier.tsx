import type { ReactNode } from "react";
import { Text } from "../primitives/Text";
import { Divider } from "../primitives/Divider";
import { KnowledgeList, type KnowledgeGroup } from "./KnowledgeList";
import { EmptyState } from "./EmptyState";

/**
 * The entity dossier: the bespoke, art-directed shell every Actor / Location / Artifact page wears
 * (ADR-P019 §A: bespoke shells are hand-built and singular; the repeating blocks inside them come from
 * the catalog). One shell for all three kinds — never three copies of the same layout (D-14).
 *
 * "Dossier, not database row" is the PRDs' own framing (Artifacts AC#4): a title, what you currently
 * understand, then what you actually collected, with the side lenses beside it.
 *
 * Every field is nullable by contract. Absent means absent: a null synthesis says so plainly and a
 * lens with nothing in it is not rendered at all, because absence is how hidden truth stays hidden
 * (B-1) — an empty panel would imply the lens was checked and came back empty.
 */
export function Dossier({
  eyebrow,
  title,
  subtitle,
  portrait,
  synthesis,
  synthesisEmpty,
  knowledge,
  knowledgeEmpty,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /**
   * A rendered picture for the hero — the caller builds it, so this shell never learns an image path or
   * a tier. Only an Actor passes one: a location or an artifact is not a face, and a portrait frame
   * around one would be the wrong shape for the thing.
   */
  portrait?: ReactNode;
  synthesis?: string | null;
  synthesisEmpty: string;
  knowledge: KnowledgeGroup[];
  knowledgeEmpty: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="dc-dossier">
      <header className="dc-dossier__hero">
        {portrait != null && <div className="dc-dossier__portrait">{portrait}</div>}
        <div className="dc-dossier__herotext">
          <span className="dc-dossier__eyebrow">{eyebrow}</span>
          <h1 className="dc-dossier__title">{title}</h1>
          {subtitle && (
            <Text tone="muted" italic className="dc-dossier__lede">
              {subtitle}
            </Text>
          )}
        </div>
      </header>

      <div className="dc-dossier__cols">
        <div className="dc-dossier__main">
          {synthesis ? <Text>{synthesis}</Text> : <EmptyState>{synthesisEmpty}</EmptyState>}
          <Divider />
          {/* KnowledgeList carries its own panel title — a section heading here would duplicate it. */}
          <KnowledgeList groups={knowledge} emptyMessage={knowledgeEmpty} />
          {children}
        </div>
        {aside != null && <aside className="dc-dossier__side">{aside}</aside>}
      </div>
    </div>
  );
}
