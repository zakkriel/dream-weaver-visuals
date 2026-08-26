# Surface 5 — Actor dossier

**Route:** `#/w/<world>/actors/<id>`
**Screenshots:** `screenshots/05-actor-dossier-viewer.png` (populated, 4 groups / 55 items) and
`screenshots/04-actor-dossier-mara.png` (**a real dossier with 25 items and no name**)
**Mockup:** `mock_compendium_actor_seren_v2.png` ✅ — the richest reference in the set, and the one
with the most struck content. Read §Struck before copying anything from it.
**Endpoint:** `GET /worlds/{w}/compendium/actors/{id}/page` → `actor_page/2`
**Fixtures:** `actor_page_viewer.json` (44 KB), `actor_page_mara.json` (20 KB)

Everything one character knows about another, as an inspectable dossier. The Location and Artifact
dossiers share this exact chrome — restyling this restyles all three.

---

## The real payload — shape

```json
{
  "schema_version": "actor_page/2",
  "world_id": "…", "viewer_id": "…",
  "actor": {
    "id": "2ac70000-…-0000000000a1",
    "perceived_name": null,
    "perceived_role": null,
    "current_synthesis": "Kade mutters into his cup\na stray dog barks in the alley…",
    "last_known_status": "Kade mutters into his cup",
    "known_artifacts": [],
    "image": { "schema_version": "image_ref/1", "asset_id": "…", "path": "/worlds/…/images/…" },
    "inline_links": [ … ],
    "collected_knowledge_groups": [
      { "group_key": "subject:2ac70000-…a1", "group_label": null,                  "items": [ …29… ] },
      { "group_key": "subject:2ac70000-…a2", "group_label": "Mara",                "items": [ …24… ] },
      { "group_key": "subject:2ac70000-…a4", "group_label": "a hooded figure",     "items": [ …1… ] },
      { "group_key": "subject:210c0000-…d1", "group_label": "The Drowned Lantern", "items": [ …1… ] }
    ]
  }
}
```

One knowledge item:

```json
{
  "perception_id": "111547b4-0722-4a34-b2bc-47d7ee0375bb",
  "content": "a gull screeches overhead",
  "epistemic_type": "told",
  "occurred_at_tick": 50769,
  "display_label": "Arrival",
  "confidence": 1,
  "decay": { "stale": true, "last_confirmed_label": "Arrival" },
  "source": { "epistemic_type": "told", "source_event_label": "Arrival" }
}
```

## Field by field

| Field | Kind | Notes |
|---|---|---|
| `perceived_name` | **world-authored — verbatim, nullable** | **`null` is common and must be designed for.** It means this viewer has no name for them yet. The app currently prints the literal word "Unknown" as an `h1`, which is weak — a better treatment is welcome, but it must not invent a name or imply one is being withheld. |
| `perceived_role` | **world-authored — verbatim, nullable** | The mockup's "Market informant, as you currently know her." **Currently NULL for every actor** — the backend does not populate it. Design the slot; expect it empty today. |
| `current_synthesis` | **world-authored — verbatim, nullable** | The lede paragraph. ⚠️ In the live capture this is **newline-separated fragments**, not prose: `"Kade mutters into his cup\na stray dog barks…"`. Preserve the breaks or wrap gracefully; do not join them into a fake sentence. `null` → the app says "Nothing synthesized yet." |
| `last_known_status` | **world-authored — verbatim, nullable** | Rendered in a side panel titled "Last known". |
| `known_artifacts[]` | data → lens | Usually `[]`. When non-empty it is a list of objects whose label key is not yet pinned in the schema. **Render only when non-empty** — an empty panel implies the lens was consulted and the answer was "nothing", which is a claim we cannot make. |
| `image` | data → picture, nullable | Hero portrait. Request `?tier=preview` (768px) — the page draws it around 128px today, so `final` would spend a megabyte for nothing. Law §3.1 rules 10–11 apply. |
| `inline_links[]` | data → links | Spans the payload marks inside the synthesis so entity names can become links (the mockup gold-underlines *Dawnfall Market*). **The app does not render these yet** — designing the treatment is welcome. |
| `id`, `perception_id`, `occurred_at_tick`, `confidence`, `world_id`, `viewer_id` | internal | **Never display.** `occurred_at_tick` is a tick (law rule 4); `confidence` is an engine number with no player meaning. |

## Collected knowledge — the grouping rule (important, and recently changed)

Groups are keyed by **what they are about**: `group_key` is `subject:<entity-uuid>`.

1. **The first group is the remainder** — everything known about *this page's own subject* and nothing
   else nameable. Its `group_label` is **`null`**, and it must render **with no heading**, its items
   sitting directly under "Collected knowledge".
   *Why:* an unheaded block placed between two headed groups reads as belonging to the one above it.
   It is only unambiguous while it is first — which the backend guarantees.
2. **Then labelled topic groups**, already ordered by recurrence then recency. In the live capture:
   `Mara` (24), `a hooded figure` (1), `The Drowned Lantern` (1).
3. **Items inside a group are already in in-world chronological order.**
4. **Every record appears exactly once** across all groups.

**Do not sort, merge, re-order or de-duplicate groups**, and **do not merge two groups that happen to
share a label** — deciding that two subjects are one topic is world truth, not presentation `[D-7]`.

✅ **The mockup's collapsible topic cards with a count badge are now buildable.** The count is
`items.length` and the title is `group_label`. This was previously impossible (the backend sent one
group per page) and is explicitly re-opened. The remainder group has no heading, so it cannot be a
collapsible card — design that asymmetry deliberately.

### `epistemic_type` — how something is known

A closed enum of ten: `direct, shared, told, overheard, public, rumor, inference, mistaken, confirmed,
disputed`. The app already maps each to story language and an icon — "Directly observed", "Told by
someone", "Publicly known", "Rumour", "Inferred", "Mistaken", "Disputed". **Never show the raw token**
`[F-2]`, and an unrecognised value must render **no label at all** rather than echoing it.

These are *epistemic* kinds, not genre kinds — they must read correctly in a noir thriller and a
workplace drama, not only in fantasy `[GA-3]`.

### `decay` — the "last known" language

`{ stale: bool, last_confirmed_label: string|null }`. When `stale` is true the app appends one of two
sanctioned phrasings and **never hides the record**:

- with a label → `last known — not confirmed since Arrival`
- without → `last known — you have not confirmed this recently`

Decay is review pressure, never a reason to fade something out of existence. Restyle the treatment
freely; keep the record fully legible and keep the wording.

## Ugly data — the real state

- **Every `perceived_name` in the actors index is `null` except Mara.** The index (surface 4) shows
  three entries, two of them nameless.
- Mara's own dossier: **25 items, one unheaded remainder group, no synthesis, no role.** The page is
  mostly empty chrome. `min-height: 72vh` currently leaves a large void beneath it.
- The viewer's dossier: **55 items across 4 groups** — this is the overflow case.
- Content strings include engine debug ids (`#1786309829959189000-5`) inside prose sentences.

Design both ends: a dossier with almost nothing, and one with 55 entries.

## Struck — in this mockup, must not be built

| In `mock_compendium_actor_seren_v2.png` | Why not |
|---|---|
| **"Relationship to you"** card + trust slider + lock | `[B-3, B-4]` — no relationship UI of any kind, ever. Copy the card's *visual treatment*; never its content. |
| **"Known possessions / associated objects"** as a title | Vocabulary `[GA-2, F-1]` — the Glossary word is **Artifacts** (or **Carrying** for what is on your person). The panel itself is fine under a correct name. |
| **"Linked to"** panel | Struck (Locations AC#4) |
| **"Add note"** button | Parked; no endpoint |
| Nav labels **Actors / Possessions** in the rail | "Possessions" is struck; the rail's four labels are fixed: Actors, Locations, Artifacts, Timeline |
| Per-item eye / link icon affordances | No endpoints; they would be dead controls `[D-14]` |

Everything else in that mockup — the display-scale name, the gold star ornament, the diamond-centred
hairline rule, the character art bleeding across the page, the collapsible knowledge cards, the side
column of framed panels, the "Report issue" button — **is fair game and wanted.**
