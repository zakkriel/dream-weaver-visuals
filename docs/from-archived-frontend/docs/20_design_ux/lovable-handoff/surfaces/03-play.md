# Surface 3 — Play

**Route:** `#/w/<world>/play` · **Screenshots:** `screenshots/02-play.png`,
`screenshots/10-play-mist-world.png` (a *light* world — see §Moods)
**Mockup:** `mock_gameplay_screen.png` ✅ — and `pixel-perfect-companion`'s `/` route is that mockup
**built and running**. Between them this is the best-specified surface in the product.

**Endpoints:** `GET /worlds/{w}/scene/current` → `scene_current/2`; `POST /worlds/{w}/beats` (and
`/beats/continue`) → a stream of `beat_frame/2`; `GET /worlds/{w}/carrying` → `carrying/1`.
**Fixtures:** `scene_current.json`, `beat_stream.json`, `beat_stream_attributed.json`, `carrying.json`.

This is the product. Everything else is reference material the player consults between beats.

---

## Composition today

Four regions inside one docked grid, 1px borders between them, no gutters:

```
┌────┬──────────────────────────────┬───────────┐
│    │ breadcrumb · day chip        │           │  ← bar
│rail├──────────────────────────────┤    aux    │
│    │  scene: place, prose, tone   │  Intent   │
│    │  participants strip          │  Current  │
│    │  ─────────────────────────   │  Carrying │
│    │  narration transcript ↓      │           │
│    ├──────────────────────────────┤           │
│    │ textarea · Send · Continue   │           │  ← input
└────┴──────────────────────────────┴───────────┘
```

The reference replaces this with four **floating islands** over a full-bleed painting: a 100px rail
inset 20px from the left, a 112px top bar, a 330px right panel column, and a centred stage where
portraits sit bottom-anchored above a dialogue card. Gutters are exactly 20px throughout.

---

## The real payload — `scene_current/2`

```json
{
  "schema_version": "scene_current/2",
  "place": {
    "id": "210c0000-…-0000000000d1",
    "label": "The Drowned Lantern",
    "description": "Low beams, salt-rot, one hearth, a bar with a hatch, a back door to the alley.",
    "tone": "tense"
  },
  "participants": [
    { "id": "…a2", "label": "Mara", "kind": "actor",
      "image": { "schema_version": "image_ref/1", "asset_id": "asset_c7874d3338a16de0",
                 "path": "/worlds/2222…/images/asset_c7874d3338a16de0" } },
    { "id": "…a3", "label": "the muscle by the bar", "kind": "actor", "image": { … } },
    { "id": "…a4", "label": "a hooded figure",       "kind": "actor", "image": { … } }
  ],
  "now": { "tick": 62061, "display_label": "Arrival" },
  "journey": null,
  "current": [ "…20 strings…" ]
}
```

### Field by field

| Field | Kind | Notes |
|---|---|---|
| `place.label` | **world-authored — verbatim** | The scene heading. Today 32→52px display type. Can be long. |
| `place.description` | **world-authored — verbatim** | One or two sentences of scene prose. Currently 20px italic muted at a 58ch measure. |
| `place.tone` | **world-authored — verbatim** | A short atmosphere string. Sometimes one word (`"tense"`), sometimes several separated by `·` or `,`. The app splits on those and renders chips. **The words are the world's — never map them to a fixed set, an icon, or a colour scale.** An unheard-of tone must render as plain text. |
| `participants[].label` | **world-authored — verbatim** | How *this viewer* names that person right now. It changes as they learn — "a hooded figure" becomes "Mara". **Two participants may carry the identical label on purpose**; do not number them on screen. |
| `participants[].image` | data → picture, or `null` | See law §3.1 rules 10–11. Build `{apiBase}{path}?tier=thumbnail` for anything ≤256px. `null` → silhouette, no spinner, no gap. |
| `participants[].kind` | internal | Always `"actor"`. Only beings with presence ever appear here — never an object, place or faction as an avatar. |
| `participants[].id` | internal | Never render. Used to ring whoever just spoke, and as a click target. |
| `now.display_label` | **world-authored — verbatim** | In-world time: `"Arrival"`, `"Day 3, Morning"`, `"the third bell"`. Rendered as a chip in the bar. |
| `now.tick` | internal — **never display** | `62061`. Ordering only. Showing it violates law §3.1 rule 4. |
| `journey` | data → state, nullable | `null` most of the time. When present: `{active, kind, goal_label, where_label, progress 0–1, legs_done, legs_total, interruptible, status}`. Renders a progress bar above the input. `goal_label`/`where_label` are **world-authored**. |
| `current[]` | **world-authored — verbatim** | "What matters now". **20 entries in the live capture, longest 116 chars, with duplicates and debug ids** — see §Ugly data. |

## The beat stream — `beat_frame/2`

Submitting text POSTs a beat and the server streams frames. Two captures are included:
`beat_stream.json` (live engine) and `beat_stream_attributed.json` (the mock server, which produces
speaker-attributed lines the live engine cannot yet).

| Frame `kind` | Carries | Renders as |
|---|---|---|
| `interpretation` | `chain[]` of `{type, stated, …}` | The **Intent** lens — see surface 9 |
| `narration` | `message: {speaker_id, speaker_label, kind, text}` | A transcript line |
| `scene` | a whole `scene_current/2` | Replaces the scene in place |
| `journey` | a journey block | Updates the progress bar |
| `result` | `{committed[], halt_reason, ticks_advanced, unresolved_candidates[], telegraphs[]}` | A status chip |
| `error` | `message` | A muted inline line — the server's own player-safe wording, rendered verbatim |
| `trace` | `reasoning_log` | Debug only, needs two keys; ignore for design |

### Narration lines — three shapes

```json
{ "speaker_id": null, "speaker_label": "", "kind": "narration", "text": "Scene: the common room, and the rain on the shutters." }
{ "speaker_id": "…a2", "speaker_label": "Mara", "kind": "speech",  "text": "The tide turns at dusk." }
{ "speaker_id": "…a4", "speaker_label": "a hooded figure by the bar", "kind": "action", "text": "draws back into the smoke" }
```

- **`narration`** — world prose, nobody's voice. **No portrait, no name, no card.** Just text.
- **`speech`** — quoted as the speaker's own words. Portrait + name + quoted body.
- **`kind` you have never seen** → fall back to plain prose. Never invent an attribution.
- The portrait on a card is **decorative**: the name is right beside it, so labelling the image would
  make a screen reader say it twice.

`halt_reason` on the `result` frame is engine vocabulary (`telegraph`, `bounce`, `unresolved`,
`journey_leg`, `world_eruption`…). It is **already mapped to player-facing sentences** in the app and
must never be shown raw.

## Carrying — `carrying/1`

```json
{ "schema_version": "carrying/1", "world_id": "…", "viewer_id": "…",
  "carried": [ { "id": "2a7f…b1", "label": "Sealed Note (gray wax)", "state": "carried",
                 "container": null, "last_confirmed_tick": 40, "quick_inspect_preview": null,
                 "decay": { "stale": true, "last_confirmed_label": "Scene" } } ] }
```

Full notes in surface 9. Two rules that bite here: **`state` is not a fixed enum** — treat an
unrecognised value as opaque text, never switch on it — and `last_confirmed_tick` is a tick, so
**never display it**; only `decay.last_confirmed_label` may be shown.

## The input dock

A `textarea` (2 rows, grows) plus two buttons. **Continue is the primary action, not Send** — it
advances the moment by exactly one beat and carries no text. Send submits what was typed. The
reference styles Continue as a filled gold pill with a chevron and Send as a quiet ghost button; the
app already matches that hierarchy, just not that treatment.

## Ugly data — design for this, not for the mockup

The live capture's `current[]` contains:

```
"a way opens between The Drowned Lantern and a huddle of driftwood shacks along the tideline #1786309829959189000-5"
"Kade murmurs something under his breath"
"Kade murmurs something under his breath"          ← exact duplicate, twice more below
"a stray dog barks in the alley behind the tavern"
```

20 entries, near-duplicates, and engine debug ids inside otherwise-prose sentences. **You may not
de-duplicate, filter, sort, group or shorten them** (law §3.1 rules 1–3). You *can* solve it with
design: a scroll region, a reading measure, density, fade, a "what matters now" that breathes. The
narration transcript has the same property — it grows without bound within a session and currently
has no affordance at all.

## Moods — one world still renders light

`screenshots/10-play-mist-world.png` is the same build on a world whose payload says `mood: "mist"`.
Mood is world-authored data layered *over* the house skin, and `mist`/`daylight` are light. This is
**deliberate and currently legal** — worlds author their own weather and unknown moods must degrade
gracefully. Whatever you design has to survive a light ground. Do not solve it by removing moods.

## Struck on this surface — present in the reference, must not be built

| In the mockup / companion | Why not |
|---|---|
| `Current \| Previously \| Open Threads` tab strip | Fixed taxonomy `[GA-3]`. The four aux-lens mockups are authoritative: `Current / Inspect / Intent / Known`. |
| "Open threads" with High / Medium / Low | Severity taxonomy + invented urgency `[GA-3]` |
| **Relationships** nav item | `[B-3]` |
| **Entities** nav item | Glossary says **Actors** `[GA-2, F-1]` |
| Avatar / account menu top-right | No session model exists; it would be a promise we cannot keep `[D-14]` |
| A second italic "stage direction" line under speech | The payload has **one** text per message. A second line would be invented narration `[D-7]`. If the founder wants it, it is a backend field — tell us. |

## Not yet built, deliberately — do not design these in

The four-lens tab strip (only two lenses exist), the Inspect and Known lenses (no endpoint), per-unit
Intent editing (no endpoint), any corrections affordance `[C-11]`, and module/action-bar slots. A
strip with dead tabs is scaffolding; leave them out.
