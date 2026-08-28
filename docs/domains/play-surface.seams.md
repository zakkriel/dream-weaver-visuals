# play-surface · seams

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-2 · The play surface and the core loop ·
**Parent bounded context:** Compendium & Play UX

A seam belongs to two domains, so it gets its own file. Each row declares an expectation — one side
owns a fact, the other consumes it and must not re-derive or re-decide it. Per `workspace:ADR-W007`
packages never cross repos, so backend-side rows name the cluster, not a package file.

---

## The Lovable seam — inside this repo

**Lovable owns the look; engineering owns the behaviour.** The split is `AGENTS.md` §The seam —
cited, not restated here; that table is the law of who touches what. What it means on this surface:

| Direction | Owner | What crosses | The expectation |
|---|---|---|---|
| provides | **Lovable** (visuals) | typed props into `components/dc/`, and the behavioural class contract (`.dc-transcript*`, `.dc-action-body`) | Wiring happens by passing typed props, never by restyling. Lovable may make `.dc-transcript` any height; it must not split the scroller, move the status inside it, or break prepend-from-the-bottom (`tech.md` §The render path — the one home). If a behaviour stops working at some size, engineering says so rather than resizing. |
| consumes | **Lovable** | the components themselves | Engineering never restyles `components/dc/` or `components/ui/`, never adds vite plugins, never breaks `bun run dev` (`AGENTS.md` rules 1-3). A visually wrong component is reported, not fixed here. |

## What this domain consumes

| Direction | Domain | What crosses | The expectation |
|---|---|---|---|
| consumes | **Play loop** (backend, WE-7) | the beat stream and its halt reasons | The engine decides who speaks, who stays silent, what resolved. Halt vocabulary is engine-facing and is mapped to player sentences in `haltCopy` — never shown raw (`F-2`). Frames may arrive in any order: a driver that cannot stream emits identical frames at the end (`docs/handoff/contracts/README.md`). |
| consumes | **Projections & replay / canon spine** (backend) | `transcript/2` — the record | The backend freezes `speaker_label` at delivery and pins that with its own tests (`D-7`). This client renders the record and never re-resolves a remembered line against the present cast, and never re-derives history from any other read. |
| consumes | **Naming wall** (backend, WE-4) | every label and every payload string, already walled | Labels arrive as what *this viewer* may call someone. The frontend never performs a knowledge check and never distinguishes "does not exist" from "not allowed to see" — they arrive identically on purpose (`B-1`, `I-3`, `D-7`). |
| consumes | **presentation-and-contracts** (UX-3, this repo) | pins, vendored schemas, generated types, `src/api/` transport, the law-test fence | Pins are exact; a mismatch fails the load. This domain reads through `src/api/` and never fetches elsewhere. `src/api/history.ts` and the history/transcript law tests sit on the boundary — claimed by both packages, moderator arbitrates (see the map notes). |
| consumes | **art-and-image-seam** (backend side) | `participants[].image` as a stable `path` | Build URLs only as `{apiBase}{path}?tier=…` and let the browser follow the redirect; never store or cache a resolved URL; never re-fetch on a text change; silhouette on null (`D-8`). Pulled, never pushed. |

## What this domain provides

| Direction | Domain | What crosses | The expectation |
|---|---|---|---|
| provides | **compendium-surfaces** (UX-1, this repo) | navigation out, between beats | The play surface links to reference surfaces; it never re-renders their content, and they never render the transcript — the record has one home. |
| provides | **Play loop** (backend) | the player's raw input | `stated` is sent exactly as typed, asterisks included (`src/lib/rp-text.ts` — display-only split). The engine interprets the raw text; a client that stripped punctuation would be editing the player's intent. |

## The seams that do not exist

Name them, because this is where an agent will otherwise improvise.

- **Inspect and Known lens endpoints, per-unit Intent editing.** No endpoint for any of them; the
  built strips and pencils wait (`product.md` §deliberately not built).
- **A corrections surface.** Deliberately never — `C-11` makes correction invisible by default;
  this is a struck seam, not a missing one.
- **`place.image` on `scene_current`.** Asked for, not delivered; a backdrop layer and scrim already
  exist unused. Design as if it will arrive.
- **A world-summary endpoint** for the world home; anything summarising the world must come from a
  payload that does not exist yet.
- **The Aux sidebar boundary against UX-1.** Two lenses live on this screen; the surface spec sits
  in the compendium pack. Unowned until the moderator or a ruling places it (`tech.md` §Open
  questions).
