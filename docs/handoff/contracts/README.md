# Contracts — the nine schemas the surfaces consume

These are **verbatim copies** of the JSON Schemas the frontend is generated against, vendored from the
backend. They are the authority on what data exists. If a field is not in here, **it does not exist**,
and designing against it means asking us for a new backend field (law §3.1 rule 2 in the README).

Every payload carries a `schema_version` string. The client pins it by **exact equality** and fails the
load on a mismatch — so `actor_page/2` and `actor_page/3` are different contracts, not compatible ones.

⚠️ **A nested payload can change without the envelope's version moving.** `beat_frame` stayed at `/2`
while the scene definition inside it went to `scene_current/2`. "The version did not change" does not
mean "the schema did not change".

---

| File | Version | Surfaces | What it is |
|---|---|---|---|
| `world_directory.v1.schema.json` | `world_directory/1` | 1, 2 | Every world a caller may choose between: id, `display_name`, a `theme` (`accent` hex, `mood` word, `ornament` word), and `playable`. A directory, never world state. A world the caller has no path to is simply **absent** rather than marked as hidden. |
| `scene_current.v2.schema.json` | `scene_current/2` | 3 | Where you are, who is present, when it is, any journey in progress, and what matters now. `place` has **no image field** — the missing piece for full-bleed scene art. `participants[].image` is an `image_ref/1` or `null`. |
| `beat_frame.v2.schema.json` | `beat_frame/2` | 3, 9 | One frame of the beat stream, discriminated by `kind`: `interpretation`, `narration`, `scene`, `journey`, `result`, `error`, `trace`. A driver that cannot stream emits the identical frames at the end, so nothing may assume arrival order. |
| `carrying.v1.schema.json` | `carrying/1` | 3, 9 | What the viewer has on them. The carrier **is** the viewer — the query takes no carrier argument, so this surface cannot be pointed at anyone else. Deliberately omits `contextual_actions` (presentation is ours) and `open_full_artifact_link` (each entry's `id` **is** the link). `state` is **deliberately not enum-pinned**. |
| `compendium_index.v1.schema.json` | `compendium_index/1` | 4, 6, 7 | One list of known things: `kind` plus `entries[]` of `{id, perceived_name}`. **That is all it carries** — no image, no subtitle, no count. |
| `actor_page.v2.schema.json` | `actor_page/2` | 5 | An actor dossier: perceived name and role, synthesis, last-known status, known artifacts, an `image`, inline link spans, and `collected_knowledge_groups`. |
| `location_page.v1.schema.json` | `location_page/1` | 6 | A location dossier: the actor fields minus the portrait, plus `part_of` (**stub, always null**), `known_areas_inside` (**always `[]`**) and `key_actors[]`. |
| `artifact_page.v1.schema.json` | `artifact_page/1` | 7 | An artifact dossier, same shape, plus type/location/holder fields that are **null in every payload the backend can currently produce**. |
| `timeline.v1.schema.json` | `timeline/1` | 8 | `records[]` in received order: content, `epistemic_type`, an ordering `occurred_at_tick`, a `display_label`, `confidence`, and `decay`. **No day structure.** |

## Four shapes that repeat across schemas

**`image_ref/1`** — `{ schema_version, asset_id, path }` or `null`. The `path` is stable; the server
302s it to a signed URL that expires in minutes. Build `{apiBase}{path}?tier=thumbnail|preview|final`
(256 / 768 / 1024, default preview). **Never store or inline the resolved URL.**

**Knowledge group** — `{ group_key: "subject:<uuid>", group_label: string|null, items[] }`. The
null-labelled remainder is always **first** and renders **with no heading**. Read
`surfaces/05-actor-dossier.md` before styling these; the ordering carries meaning.

**Knowledge item** — `{ perception_id, content, epistemic_type, occurred_at_tick, display_label,
confidence, decay, source }`. Display `content`, the mapped `epistemic_type`, `display_label` and the
decay language. **Never** display `perception_id`, `occurred_at_tick` or `confidence`.

**`decay`** — `{ stale: bool, last_confirmed_label: string|null }`. Two sanctioned phrasings, listed in
surface 5. A stale record never disappears.

## The one field we have asked for and do not have

**`place.image` on `scene_current`.** Both design references are art-first — a painted scene fills the
viewport and the UI floats over it. `participants[].image` exists; the place has nothing. The frontend
shell already has an unused backdrop layer and a scrim built for exactly this. **Design as if it will
arrive, and make sure the surface still reads without it.**
