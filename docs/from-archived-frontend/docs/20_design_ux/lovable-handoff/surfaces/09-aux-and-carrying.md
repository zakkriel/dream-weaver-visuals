# Surface 9 — Aux sidebar (lenses) + Carrying overlay

**Route:** part of `#/w/<world>/play` · **Screenshots:** `screenshots/02-play.png` (right column)
**Mockups:** `mock_aux_lens_current.png`, `mock_aux_lens_intent.png`, `mock_aux_lens_known_actor.png`,
`mock_aux_lens_inspect_artifact.png` ✅ — **these four are the authoritative aux reference**, above the
gameplay mockup's own sidebar, which contains struck content.
**Endpoints:** `scene_current/2` (`current[]`), the `interpretation` frame of `beat_frame/2`,
`carrying/1`.

The right-hand column beside the play surface. It has a **docked** and a **full** mode; full currently
expands into the main column while keeping the rail and bar, which is not obviously right and is open.

---

## What exists today, and what does not

| Lens | Status |
|---|---|
| **Current** | ✅ built — "What matters now", fed by `scene_current/2.current[]` |
| **Intent** | ✅ built (render-only) — fed by the `interpretation` frame |
| **Inspect** | ❌ **not built.** No endpoint, and its "You could…" actions must be backend-generated `[D-14]` |
| **Known** | ❌ **not built.** Feedable today but would duplicate the dossier — a second path for one job `[D-14]` |
| **Carrying overlay** | ✅ built — a disclosure at the bottom of the column |

⚠️ **Do not design the four-lens tab strip in.** Two of four lenses exist; a strip with two dead tabs
is scaffolding. The strip lands when Inspect and Known do. Intent currently sits *above* Current
because Intent is bounded while Current grows — below an unbounded list it would fall off the panel.

## Current lens

Fed by `scene_current/2.current[]` — **20 strings in the live capture**, longest 116 characters, with
exact duplicates and engine debug ids. All **world-authored, verbatim** (law §3.1 rule 1): no
de-duplication, no filtering, no sorting, no truncation of meaning.

Today: a 12px uppercase "WHAT MATTERS NOW" label, then lines each behind a 1px accent hairline rule.
The mockup wraps it in a framed card with a star-centred divider and, above it, a **place card**
(name, prose, "Atmosphere" chips, "Time") — note that place data lives in the main column in our
layout, so moving it here is a composition decision, not new data.

**Struck from the gameplay mockup's sidebar:** the `Current | Previously | Open Threads` tab strip
(fixed taxonomy `[GA-3]`) and "Open threads" with High/Medium/Low (severity + invented urgency
`[GA-3]`). The four lens mockups do not contain either.

## Intent lens

Fed by the `interpretation` frame:

```json
{ "schema_version": "beat_frame/2", "kind": "interpretation",
  "chain": [ { "type": "Communicated", "stated": "I ask Mara about the tide" } ] }
```

| Field | Kind | Notes |
|---|---|---|
| `chain[].type` | data → catalog | An engine tag (`Communicated`, `Moved`, `UNRESOLVED`, …). Mapped to nine story-language phrases; **never show the raw token** `[F-2]`. |
| `chain[].stated` | **the player's own words — verbatim** | Quoted back to them. Editing this would misquote the player, which is the exact thing the lens exists not to do. |
| `chain[].reference` | **player's phrase, verbatim** | Only on the `UNRESOLVED` shape — the phrase that could not be pinned. |

Today: a numbered list with the ordinal in a 32px right-aligned display-face gutter. An **empty chain**
means "the engine read your words and found nothing it could act on" and says so; a **Continue press**
carries no words at all and the lens stays away entirely. Those two are different and must not be
collapsed.

**Struck from `mock_aux_lens_intent.png`:**

- **"Interpretation confidence — High (82%)"** — there is **no confidence field in `beat_frame/2`**.
  A number here would be a fabricated reading of the player's own words `[D-7]`. Struck.
- **The per-unit pencil icons** — per-unit correction has no endpoint. An edit affordance that cannot
  edit is worse than none `[D-14]`.
- **Nested / conditional units** ("IF NEW & RELEVANT RUMORS EXIST") — the chain is a flat ordered
  array with no branching. There is nothing to render.

## Known lens — `mock_aux_lens_known_actor.png`

Not built. The mockup is nonetheless **useful as visual reference for the dossier** (surface 5): the
per-kind icon + uppercase kind label + prose block, the diamond-centred dividers, the portrait-beside-
name header, the closing pull-quote. Those treatments are wanted; the lens itself waits on Inspect.

## Inspect lens — `mock_aux_lens_inspect_artifact.png`

Not built, no endpoint. Its **"You could… / Look closer / Ask about / Reflect on"** block must be
**backend-generated data tagged by kind** `[D-14]` — a hardcoded client list of verbs is prohibited,
for the same reason the Carrying overlay ships no action buttons. The card's *visual language* (large
object image, centred name, italic sensory prose, "What you notice" bullets, ornamental frame) is
excellent reference and fully adoptable.

## Carrying overlay — `carrying/1`

```json
{ "schema_version": "carrying/1", "world_id": "…", "viewer_id": "…",
  "carried": [ { "id": "2a7f0000-…b1", "label": "Sealed Note (gray wax)", "state": "carried",
                 "container": null, "last_confirmed_tick": 40, "quick_inspect_preview": null,
                 "decay": { "stale": true, "last_confirmed_label": "Scene" } } ] }
```

| Field | Kind | Notes |
|---|---|---|
| `label` | **world-authored — verbatim** | The viewer's own name for the object. |
| `state` | data → **not a fixed enum** | `carried` is the only value the world can produce today; the set widens later. **Never switch on it exhaustively and never hold an allowlist** — an unrecognised value must render as opaque text. Today the app shows the word only when the rows do **not** all share one value, so a single repeated word never runs down the column. |
| `container` | data → nesting, nullable | `null` = directly on you. Non-null `{id, label}` = inside another thing of yours. The label is world-authored. |
| `quick_inspect_preview` | **world-authored — verbatim, nullable** | The latest thing this character knows about the object. `null` is ordinary — you can carry what you know nothing about. |
| `decay` | data → language | Same two sanctioned phrasings. **A stale carry state keeps its place and says so — it never disappears.** |
| `last_confirmed_tick` | internal — **never display** | A tick `[B-5]`. Only `decay.last_confirmed_label` may be shown. |
| `carried: []` | data → state | **"You are carrying nothing" is an answer, not a missing page** — it must be said out loud, and must look different from a failed load (which renders no overlay at all). |
| `id` | data → link | The artifact dossier route is composed from it. ⚠️ It may 404 today — see surface 7. |

### Hard constraint: no action affordances

The PRD sketches contextual per-item verbs (Read / Draw / Count / Show / Hide). **`carrying/1` ships no
`contextual_actions` field**, so a verb button here would be the client deciding what the world permits
`[D-14, D-7]`. The overlay is: what is known, plus a link to the full record. **Zero buttons** — a test
asserts it.

The verbs land the day the payload carries them. If the design needs them, say so and we will ask.

### Placement

The PRD puts it "in the lower part of the right AUX sidebar, below the active lens content", collapsible
to a single row and expandable to a compact list. It is **not** an inventory page, **not** the Artifact
Compendium, and must not grow slots, a grid, weights or an encumbrance bar.
