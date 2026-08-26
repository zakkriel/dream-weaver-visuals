# Chunk-4 Frontend Leg — Read-only Compendium Presentation

**Date:** 2026-06-15
**Repo:** `zakkriel/dreamchat-frontend` (presentation only — never world truth)
**Scope:** Presentation + navigation half of the read-only Compendium. The backend leg
(page/index/timeline endpoints, their published schemas, and the SPEC-011 contract test) is
already merged on backend `main`. This leg renders what those endpoints return and proves the
FE itself cannot leak.

## Hard constraints (safety-load-bearing — not relitigated here)

- **D-7 — presentation only.** All perception-binding and filtering is server-side. The FE
  renders exactly what the API returns; it performs NO filtering, re-derivation, sorting, or
  canon lookups of its own.
- **Existence indistinguishability.** A withheld entity and a genuinely nonexistent one both
  return 404. The FE renders an identical not-found state for both and never branches UI on
  "withheld vs missing" — the distinguishing information is not present in any payload.
- **Honest nulls.** `perceived_name: null` → a neutral placeholder ("Unknown"), never a
  fallback name lookup. `inline_links: []` → render nothing, no placeholder.
  `current_synthesis` / `last_known_status` / etc. `null` → shown as absent, never fabricated.
- **Endpoint isolation.** The FE talks ONLY to the published compendium / page / timeline
  endpoints. It never calls anything that returns unfiltered canon.
- **Debug `?viewer=` passthrough.** The operator can browse as Player or as Jonas. The override
  only changes which viewer the API filters for; the FE behaves identically regardless of viewer
  and never interprets the value — it only forwards it.

## The contract (vendored from backend `main`, `core/api/schema/`)

Five published schemas, confirmed by listing the backend directory:

| Schema | `$id` | Shape (relevant fields) |
|---|---|---|
| `compendium_index.v1.schema.json` | `compendium_index/1` | `{ schema_version, world_id, viewer_id, kind: actor\|location\|artifact, entries: [{ id, perceived_name\|null }] }` |
| `actor_page.v1.schema.json` | `actor_page/1` | `actor: { id, perceived_name\|null, perceived_role\|null, current_synthesis\|null, last_known_status\|null, known_artifacts[], inline_links[], collected_knowledge_groups[] }` |
| `location_page.v1.schema.json` | `location_page/1` | `location: { id, perceived_name\|null, part_of\|null, current_synthesis\|null, last_known_status\|null, known_areas_inside[], key_actors[], inline_links[], collected_knowledge_groups[] }` |
| `artifact_page.v1.schema.json` | `artifact_page/1` | `artifact: { id, perceived_name\|null, perceived_type\|null, current_synthesis\|null, last_known_location\|null, current_holder_owner_access\|null, inline_links[], collected_knowledge_groups[] }` |
| `timeline.v1.schema.json` | `timeline/1` | `records: [{ perception_id, content, epistemic_type, occurred_at_tick, display_label\|null, confidence, decay }]` (already ordered by `occurred_at_tick`) |

`collected_knowledge_groups` item shape (shared by all three page types):
`{ group_key, group_label|null, items: [{ perception_id, content, epistemic_type, occurred_at_tick, display_label|null, confidence, decay, source }] }`.

**Opaque arrays.** `inline_links`, `known_artifacts`, `known_areas_inside`, and `key_actors` are
declared as arrays of objects with **no inner shape published** (`{ [k]: unknown }`). Per design
decision, these are **not rendered** this leg (empty or populated). Cross-navigation happens
through the index lists, which carry a typed `{ id, perceived_name }` contract. `[]` renders
nothing, satisfying the honest-nulls constraint. They become renderable only when the backend
publishes their shape.

## Endpoints (confirmed from backend routes + tests)

```
GET /worlds/{w}/compendium/actors            → compendium_index/1 (kind=actor)
GET /worlds/{w}/compendium/locations         → compendium_index/1 (kind=location)
GET /worlds/{w}/compendium/artifacts         → compendium_index/1 (kind=artifact)
GET /worlds/{w}/compendium/{kind}/{id}/page  → {actor,location,artifact}_page/1
GET /worlds/{w}/compendium/timeline          → timeline/1
```

All accept an optional `?viewer=<uuid>` query. Vite dev-proxies `/worlds` → backend
(`BACKEND_URL`, default `http://localhost:8080`).

## Architecture

### 1. Contract vendoring & codegen

- New `contracts/` dir holds verbatim copies of the five schemas, sourced from the local sibling
  clone `/Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/` (readable this
  session; otherwise `raw.githubusercontent.com/zakkriel/dreamchat-world-backend/main/core/api/schema/`).
- `contracts/README.md` records provenance: vendored from backend `main`; do not hand-edit;
  re-vendor + `npm run gen:types` to update; `npm run verify:contract` confirms they match
  upstream.
- `gen:types` regenerates **all five** TS type files under `src/types/` from `contracts/*.json`,
  replacing the current single-schema, stale-path (`../core/api/schema/...`) invocation.

### 2. Drift enforcement (both kinds)

- **`verify:types` (hermetic, CI/build, no network).** Regenerates types from the vendored
  schemas into a temp location and `git diff --exit-code` against committed `src/types/`. Fails on
  any mismatch, so a hand-edited type or stale codegen breaks the build.
- **`verify:contract` (opt-in, needs backend).** Diffs `contracts/*.json` against backend `main`
  (sibling clone if present, else `raw.githubusercontent.com/.../main/core/api/schema/`). Fails if
  vendored ≠ upstream. **Required checklist item** in the PR and on any future re-vendor (see
  Delivery) — not scheduled CI, but a step that actually gets ticked.

### 3. API layer (`src/api.ts`) — the leak-proof boundary

- Exports `fetchIndex(world, kind)`, `fetchPage(world, kind, id)`, `fetchTimeline(world)`.
- **Single URL chokepoint.** Every request URL is built by one `compendiumUrl()` helper that can
  only ever produce `/worlds/{w}/compendium/...` paths. This is the single place URLs are
  constructed — the surface the network-allowlist test asserts against.
- **`?viewer=` passthrough.** Read once from the page URL (`location.search`); appended verbatim
  to outgoing requests when present. Never interpreted, only forwarded. Behavior identical for any
  value.
- **404 handling (existence indistinguishability).** A 404 from any endpoint resolves to a single
  typed `NotFound` sentinel (not an exception, not a payload). Exactly one 404 path; no field
  anywhere distinguishes withheld vs missing, so the FE cannot branch on it.
- **Non-404 failures.** 500 / network errors map to a separate generic "couldn't load" error,
  kept distinct from `NotFound` so a backend outage never renders as "not found".

### 4. Routing (hash router, zero deps)

- `src/router.tsx` parses `location.hash` into `{ surface, kind, id }`, renders the matching
  component, and re-renders on `hashchange`. `?viewer=` lives in `location.search` and is
  preserved across hash navigation (links change only the hash).

```
#/actors            → actor index          #/locations        → location index
#/actors/:id        → actor page           #/locations/:id    → location page
#/artifacts         → artifact index       #/timeline         → timeline
#/artifacts/:id     → artifact page        unknown hash       → home/index surface
```

### 5. Components (reuse the Chunk-3 pattern)

**Shared (extracted from the existing `ActorPage`):**

- `KnowledgeGroups` — renders `collected_knowledge_groups` using the actor page's existing
  group/item markup, lifted as-is.
- `Field` / absent-handling helper — `perceived_name ?? "Unknown"`; nullable text fields render
  their section only when non-null, never a fabricated value.
- `NotFound` — the single, identical not-found view for every 404.
- `PageShell` — the `<main>` wrapper + heading.

**New surfaces:**

- `IndexList` — one component for all three kinds; renders `entries` **in received order**, each a
  hash link to its page; `perceived_name ?? "Unknown"`. No client-side filtering, sorting, or
  additions.
- `LocationPage` — `perceived_name`, `part_of`, synthesis, last-known, `KnowledgeGroups`.
- `ArtifactPage` — `perceived_name`, `perceived_type`, synthesis, `last_known_location`,
  `current_holder_owner_access`, `KnowledgeGroups`.
- `Timeline` — renders `records` **in received order** (no client sort), reusing the
  knowledge-item markup for each record.

`ActorPage` is refactored to consume the shared `KnowledgeGroups` / `PageShell` / `NotFound`
(behavior unchanged — pinned by a regression test, see Tests). `inline_links` and the other opaque
arrays are not rendered on any page.

### 6. Build/CI wiring

- `package.json` scripts: fixed `gen:types` (all five), `verify:types`, `verify:contract`,
  `test` (vitest). `build` stays `tsc && vite build`.
- Add devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`; minimal
  vitest config (jsdom environment).

## Tests (TDD — Vitest + Testing Library + jsdom, failing-test-first)

1. **Withheld name → placeholder.** `perceived_name: null` payload renders "Unknown"; the rendered
   DOM contains no canon name (fixture proves no name string leaks).
2. **404 indistinguishability.** A 404 for a "withheld" id and a 404 for a "nonexistent" id render
   byte-identical `NotFound` output.
3. **Index renders exactly returned entries.** Given N entries (including a null-name one), exactly
   N links render, in received order, with no additions, removals, or reordering.
4. **Network allowlist.** Spy on `fetch`; drive every surface; assert every captured URL matches
   `^/worlds/[^/]+/compendium/(actors|locations|artifacts)(/[^/]+/page)?$` or
   `.../compendium/timeline`, with only an optional `?viewer=` query. Any other call fails.
5. **`?viewer=` forwarded (its own teeth).** Given `location.search = "?viewer=X"`, every outgoing
   fetch across all surfaces (index, all three page types, timeline) carries `viewer=X` verbatim.
   The rendered operator gate depends on this forwarding, so it is asserted independently of the
   permit-in-pattern check of Test 4.
6. **ActorPage refactor regression.** Render `ActorPage` and pin its output, proving the lift onto
   shared components is behavior-preserving rather than asserted. Same bar as the backend refactor
   onto the shared knowledge core.
7. **(supporting) Honest nulls.** Null synthesis / last-known render as absent, not fabricated;
   `inline_links` never produces output.

## Delivery

- One fresh branch off `main` → one PR to `main` (not a session branch).
- **No gate run, no tagging** — the operator renders and runs the gate after merge.
- **PR/merge checklist** includes a ticked `npm run verify:contract` step (also required on any
  future re-vendor).
- Final step: summarize the PR contents and stop.

## Non-goals (YAGNI)

- No rendering of opaque arrays (`inline_links`, `known_artifacts`, `known_areas_inside`,
  `key_actors`) until the backend publishes their shape.
- No client-side filtering, sorting, search, or canon lookups of any kind (D-7).
- No relationship UI, no genre sections, no module slots (out of this leg's surfaces).
- No `react-router`, no SPA-fallback server config (hash router needs neither).
