# Fixtures — real data, and a mock server to build against

Everything here is a **real capture** from a running DreamChat backend on 2026-08-09. It is dev seed
data, not user data: nothing is redacted and nothing needs to be.

```
payloads/     12 JSON captures, one per endpoint the surfaces consume
assets/       3 real portrait PNGs at the tiers the app actually requests
mock-server.mjs   a zero-dependency Node server that speaks the same contracts
```

---

## Quick start — build against the mock server

The mock server is the same file the frontend team uses. **Node 18+, no `npm install`, no
dependencies, no database.**

```bash
node mock-server.mjs                 # → http://localhost:8787
node mock-server.mjs --port 9000
node mock-server.mjs --help          # lists the scenario keywords
```

Point your app's API base at it. Every endpoint below answers with contract-valid data, CORS is open
to the usual dev origins, and it serves generated placeholder portraits so the image path works
end-to-end.

| Method | Path |
|---|---|
| `GET` | `/worlds` |
| `GET` | `/worlds/{w}/scene/current` |
| `POST` | `/worlds/{w}/beats` (body `{"text": "…"}`) |
| `POST` | `/worlds/{w}/beats/continue` (no body) |
| `GET` | `/worlds/{w}/images/{asset_id}?tier=thumbnail\|preview\|final` |

Use world id `22222222-2222-2222-2222-222222222222`.

### Driving states you cannot otherwise reach

**This is the mock server's real value.** Type one of these as the beat text and it produces that
state deterministically — states the live engine cannot be made to produce on demand:

| Beat text | State |
|---|---|
| *(anything else)* | An ordinary completed beat, **including a speech line and an action line with speakers** |
| `unresolved` | "Who did you mean?" — two options with distinguishing detail |
| `unresolved-same` | Two options that read **identically** — the honest edge case, where position in the row is the only clue |
| `journey` | An active travel journey, mid-leg (drives the progress bar) |
| `arrive` | A journey that reached its goal |
| `interrupt` | The world cuts across your path mid-journey |
| `barred` | The way is shut |
| `bounce`, `telegraph`, `premise_broken`, `turn_budget`, `gate_reject` | The remaining halt reasons, one each |
| `error` | A failure **after** the stream opened — arrives as a frame, not a status |
| `boom` | A failure **before** the stream opens — an HTTP 500 |
| `slow` | Frames spread over ~2.5s — watch the pending state and real streaming |

`reset` puts the scene back to its landing state.

⚠️ The mock server serves **the play surface only** (`/worlds`, scene, beats, images). The compendium
surfaces have no mock endpoints — use the static JSON in `payloads/` for those.

---

## `payloads/` — what each capture is

| File | Endpoint | Notable |
|---|---|---|
| `world_directory.json` | `GET /worlds` | 2 worlds. One has `mood: "mist"` — a **light** mood. |
| `scene_current.json` | `GET /worlds/{w}/scene/current` | 3 participants all with portraits; **20** `current[]` lines with duplicates and debug ids; `journey: null` |
| `beat_stream.json` | `POST …/beats` — **live engine** | 6 frames. Narration is **unattributed** (`speaker_id: null`) — all the live bridge can produce today |
| `beat_stream_attributed.json` | `POST …/beats` — **mock server** | 8 frames including a `speech` line from Mara and an `action` line from a figure **with no portrait** — the two attributed shapes plus the silhouette case |
| `carrying.json` | `GET …/carrying` | 1 item, **stale**, no preview, no container |
| `index_actors.json` | `GET …/compendium/actors` | 3 entries, **2 with `perceived_name: null`** |
| `index_locations.json` | `…/compendium/locations` | 1 entry, name `null` |
| `index_artifacts.json` | `…/compendium/artifacts` | **`entries: []`** — the empty state is the only state |
| `actor_page_viewer.json` | `…/actors/{viewer}/page` | **44 KB.** 4 groups / 55 items — the overflow case, and the best demonstration of subject grouping |
| `actor_page_mara.json` | `…/actors/{mara}/page` | 20 KB. **1 unheaded remainder group, 25 items, no synthesis, no role** |
| `location_page.json` | `…/locations/{id}/page` | `part_of: null`, `known_areas_inside: []`, 1 `key_actor` with a null name |
| `timeline.json` | `…/compendium/timeline` | **59 records**, 36 stale, only **two** distinct `display_label` values |

### Design against the awkward ones

`actor_page_mara.json` and `actor_page_viewer.json` are the two ends of the same surface — 25 items
under no heading, versus 55 items across four groups. `index_artifacts.json` is empty. Half the names
are `null`. Several content strings contain engine ids like `#1786309829959189000-5` mid-sentence.

**This is the product's real data.** A design that only looks right on the mockups' tidy fictional
content will not survive contact with it.

---

## `assets/` — sample portraits

| File | Tier | Size | Used at |
|---|---|---|---|
| `portrait-mara-thumbnail-256.png` | `?tier=thumbnail` | 256×256 | Participants strip (64px), narration cards (32px) |
| `portrait-mara-preview-768.png` | `?tier=preview` | 768×768 | Actor dossier hero (~128px) |
| `portrait-the-muscle-thumbnail-256.png` | `?tier=thumbnail` | 256×256 | A second face, for collision and row-layout tests |

These are the **real current assets** — placeholder mosaics from a mock image provider. Painted art is
coming from a separate pipeline and will arrive at the same paths, the same tiers and the same sizes,
so no design change is needed when it lands.

**Always request the smallest tier that covers the drawn size.** A 64px avatar asking for `final`
(1024px) spends a megabyte to show a thumbnail.

There is deliberately **no scene backdrop asset** — see `../contracts/README.md`, last section.

---

## Two behaviours to reproduce, not redesign

**Images swap in, they never block.** A portrait is `null` until it is not. Narration must render
immediately with a silhouette and the picture appears on a later read — no spinner, no reserved hole,
no layout shift.

**A name changes; a face does not.** As a character learns, `label` goes from "a hooded figure" to
"Mara" while `image.path` stays byte-identical. Never key an image off a label and never bust its
cache on a text change.
