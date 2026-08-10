/**
 * The world directory types, re-exported from CODEGEN.
 *
 * This file used to be a hand-written mirror of the schema. It claimed to mirror it exactly and did
 * not: it widened `theme`, `accent` and `ornament` to optional-and-nullable when the schema requires
 * all three, and it typed `schema_version` as a bare string when the contract pins a literal.
 *
 * It survives as a re-export rather than being deleted so that `components/dc/` — which Lovable owns
 * and we do not edit — keeps importing the same path it always did. The names are identical; only
 * the source of truth moved. Regenerate with `bun run gen:types`; `verify:types` fails the build if
 * the generated file drifts from `contracts/world_directory.v2.schema.json`.
 *
 * The contract is now `world_directory/2`, which added three fields the picker may use:
 * `tagline` (one world-authored line, nullable), `cover_image` (an `image_ref/1`, nullable) and
 * `last_place_label` (a label and nothing else — no tick, no timestamp).
 */
import type {
  WorldDirectory2GETWorldsTheWorldsACallerMayChooseBetweenSPEC028ADIRECTORYNeverCanonAnIdANameALineOfFictionALookACoverWhereYouLeftOffAndWhetherAnyoneCanPlayItNoWorldSTATEOnThisSurface as Generated,
  WorldTheme1,
} from "@/api/types/world_directory";

export type WorldTheme = WorldTheme1;
export type WorldDirectoryEntry = Generated["worlds"][number];
export type WorldDirectory = Generated;
