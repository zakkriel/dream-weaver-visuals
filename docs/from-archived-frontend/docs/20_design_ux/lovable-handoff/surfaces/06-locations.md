# Surface 6 — Locations (index + dossier)

**Routes:** `#/w/<world>/locations`, `#/w/<world>/locations/<id>`
**Screenshot:** `screenshots/06-locations-index.png`
**Mockup:** `mock_compendium_location_dawnfall_market.png` ✅ — visually the most ambitious mockup, and
roughly **half of its content is either struck or unavailable**. Read §Reality before working from it.
**Endpoints:** `GET …/compendium/locations` → `compendium_index/1`; `…/locations/{id}/page` →
`location_page/1` · **Fixture:** `fixtures/payloads/location_page.json`

The index is identical in shape to surface 4. The dossier shares surface 5's chrome plus three
location-specific fields.

## The real payload — the location-specific parts

```json
{
  "schema_version": "location_page/1",
  "location": {
    "id": "210c0000-…-0000000000d1",
    "perceived_name": null,
    "part_of": null,
    "current_synthesis": "I stepped into the Drowned Lantern.",
    "last_known_status": "I stepped into the Drowned Lantern.",
    "known_areas_inside": [],
    "key_actors": [
      { "id": "2ac70000-…a1", "kind": "actor", "perceived_name": null,
        "last_seen_tick": 50, "evidence_count": 1 }
    ],
    "collected_knowledge_groups": [ { "group_key": "subject:210c0000-…d1", "group_label": null, "items": [ … ] } ],
    "inline_links": [ … ]
  }
}
```

## Field by field — the location-only fields

| Field | Kind | Notes |
|---|---|---|
| `part_of` | data → hierarchy, nullable | The containing place. **Currently a stub — always `null`.** Design the slot; expect nothing. ⚠️ Only **one** expression of hierarchy is permitted `[C-12]`: a breadcrumb **or** a tree, never both. The mockup shows both. |
| `known_areas_inside[]` | data → children | **Hardcoded `[]` by the backend today.** The mockup's four image cards ("East Stalls", "Merchant Row"…) have no source. Design it; expect empty. |
| `key_actors[]` | data → lens | Who this character has seen here. `perceived_name` **nullable** (it is `null` in the live capture). `last_seen_tick` is a **tick — never display it** `[B-5]`; the mockup's "Seen 1h ago" is struck for exactly this reason. `evidence_count` is an engine number; showing it as "1 record" is borderline invented framing — prefer not to. |
| `perceived_name`, `current_synthesis`, `last_known_status`, `collected_knowledge_groups`, `inline_links` | — | Identical semantics to surface 5. The grouping rule is the same. |

## Reality vs the mockup

| Mockup element | Status |
|---|---|
| Full-bleed location artwork | **No image field exists on `location_page/1` at all** (unlike actors). Would need a backend field. |
| Location Hierarchy tree in a left panel | **Struck** `[C-12]` — one expression of hierarchy only, and a breadcrumb already exists |
| "Part of" chips row | Payload field exists but is a **stub (`null`)**; and it is the *other* half of the C-12 choice |
| "Known areas inside" image cards | Field exists, **always empty**; also needs images that do not exist |
| "Key actors seen here" with **"Seen 1h ago"** | Row is fine; **the wall-clock phrasing is struck** `[B-5]`. Use the in-world label or nothing. |
| "Collected knowledge" with a **"Group by topic"** dropdown | Grouping is decided server-side by about-ness. A client-side regroup control would be the client deciding meaning `[D-7]`. **Struck.** |
| "Linked to" panel | **Struck** (Locations AC#4) |
| Tags: Urban / Public / Trade Hub | No such field. Would be invented `[D-7]`. The nearest real thing is the scene's `tone`, which is on Play, not here. |

**What is left, and is wanted:** the display-scale name, the pin ornament, the framed panel language,
the two-column composition, the knowledge treatment, and how a nearly-empty dossier can still look
deliberate — which is the actual state of this surface today.
