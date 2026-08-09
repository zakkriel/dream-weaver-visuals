/**
 * Mirrors contracts/world_directory.v1.schema.json exactly.
 * Nothing here is derived, widened or invented.
 */

export interface WorldTheme {
  schema_version: string;
  /** free-form atmosphere word; unknown values must degrade silently */
  mood: string;
  /** hex chosen by the world; may be missing or malformed */
  accent?: string | null;
  /** free-form motif word; unknown values must degrade silently */
  ornament?: string | null;
}

export interface WorldDirectoryEntry {
  /** UUID — link target only, never rendered */
  id: string;
  /** world-authored, rendered verbatim */
  display_name: string;
  theme?: WorldTheme | null;
  playable: boolean;
}

export interface WorldDirectory {
  schema_version: string;
  worlds: WorldDirectoryEntry[];
}
