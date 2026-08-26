# Surface 8 — Timeline

**Route:** `#/w/<world>/timeline` · **Screenshot:** `screenshots/08-timeline.png`
**Mockup:** `mock_compendium_timeline.png` ✅ — but see §The day-column question, which is a hard
constraint rather than a preference.
**Endpoint:** `GET /worlds/{w}/compendium/timeline` → `timeline/1`
**Fixture:** `fixtures/payloads/timeline.json` — **59 real records**

The chronological spine of what this character has perceived. Currently the flattest surface in the
product: its entire stylesheet is *three declarations* — 8px vertical padding and a 1px bottom rule.

## The real payload

```json
{
  "schema_version": "timeline/1",
  "world_id": "…", "viewer_id": "…",
  "records": [
    {
      "perception_id": "2a4e0000-…-0000000000a1",
      "content": "Mara",
      "epistemic_type": "told",
      "occurred_at_tick": 25,
      "display_label": "Genesis",
      "confidence": 1,
      "decay": { "stale": true, "last_confirmed_label": "Genesis" }
    }
  ]
}
```

Live capture: **59 records**, `epistemic_type` ∈ {`direct`, `shared`, `told`}, **36 of 59 stale**, and
only **two** distinct `display_label` values across the whole set: `Genesis` and `Arrival`.

## Field by field

| Field | Kind | Notes |
|---|---|---|
| `content` | **world-authored — verbatim** | The record itself. Ranges from a bare name (`"Mara"`) to a full sentence with debug ids in it. |
| `display_label` | **world-authored — verbatim** | The in-world time. **Only two distinct values across 59 records** — so a design that assumes one heading per unique label produces two enormous buckets, and a design that prints the label on every row repeats one word 30+ times. This is the hard problem on this surface. |
| `epistemic_type` | data → catalog | Same closed enum and same story-language mapping as surface 5. Never show the raw token `[F-2]`. |
| `decay` | data → language | Same two sanctioned phrasings. **61% of records are stale** — whatever "stale" looks like will be everywhere, so it must be quiet. |
| `occurred_at_tick` | internal — **never display** | Ordering only `[B-5]`. |
| `perception_id`, `confidence` | internal | Never display. |

## The day-column question — a constraint, not a preference

The mockup shows a horizontal beaded rail with **Day 1 / Day 2 / Day 3…** columns and a detail pane.

**We cannot build the columns.** `timeline/1` carries no day structure — only an ordering `tick` and a
free-text `display_label`. Producing "Day 3" means parsing structure out of a label string, which is
the client deriving world truth `[D-7]`. This was decided, and it still holds: the live labels are
`Genesis` and `Arrival`, which no parser turns into days.

**What is wanted, and is fully open:**

- the **spine** itself — a rail, beads, ticks, connectors, a gutter — applied to *received order*
- grouping by **runs of identical `display_label`**, which is honest because the label is the world's
  own and consecutive identical labels really are the same moment
- the detail pane's *treatment*, if it is fed by selection rather than by invented structure
- density, rhythm, how 59 near-identical rows can read as a chronicle rather than a log

**Struck from this mockup:** "Jump to…" (nothing to jump to without day structure), "Linked entities /
Linked locations" panels (Locations AC#4), and "View in current thread" (no such route).

**The pull-quote footer** ("Threads of chance weave the pattern of fate…") is *invented copy* — there
is no payload field for it. As pure decorative chrome with no claim about the world it would be
acceptable, but it must be recognisably ours, never dressed as a world record `[D-7]`.
