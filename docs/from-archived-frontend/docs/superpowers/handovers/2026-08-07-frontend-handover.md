# HANDOVER — dreamchat-frontend (2026-08-07)

**State:** `main` = `3d8e262`. Clean tree, no open PRs, **133 tests green**, `tsc` clean (source *and*
tests), `vite build` clean, `verify:types` OK, `verify:contract` OK against backend `main`.

**Scope reminder:** this repo owns presentation only, never world truth (D-7). The law lives in
`dreamchat-world-backend/docs` (D-6) — cite rule IDs, never copy the docs here.

---

## 1. What landed this session (context for the ledger below)

| PR | What |
|---|---|
| #5 | Brought the app to `main`: design system, atmospheric chrome, play surface, `schema_version` validation |
| #6 | Configurable backend origin (SPEC-020); the trace needs a second key (C-4) |
| #7 | Named-slot shell (SPEC-023), kind→component catalog (D-14), world id as runtime state (SPEC-022) |
| #8 | Compendium pages as dossiers on the design system |
| #9 | Decay names its last confirmation; empty timeline reads as unknown; tests are typechecked |
| #10 | **Rung 4** — the play surface against the streamed contract (`scene_current/1`, `beat_frame/1`) |

Backend-side, `dreamchat-world-backend` PR **#31** (merged) carries SPEC-028 and SPEC-029, both raised
from this repo.

---

## 2. Blocked on a backend ruling — not on code

**SPEC-028 — world management.** Nothing can list worlds, so no world picker is possible. The FE ships
world id as runtime state from the URL (`#/w/<id>/…`) with dev fallbacks in **one place**:
`src/routes.ts` → `DEV_WORLD`, `DEV_PLAY_WORLD`, `DEV_PLAY_VIEWER`. **Delete that whole block the day
`GET /worlds` lands**, and the play viewer with it.

**SPEC-029 — the Compendium projections are skeletons.** Every page field ships `NULL`/`[]` and
`decay.stale` is the literal `false`. Consequence: the Actor/Location/Artifact pages render thin, and
**ten acceptance criteria across the four Compendium PRDs are unmeetable** whatever the FE does, so
chunk 4's gate stays open. The FE side is built and tested against fixtures and will light up with no
code change when the lenses fill: side lenses render only when non-empty, and the decay language is
wired and waiting.

---

## 3. Planned, designed, not built

Ordered by what unblocks the most. Each names its blocker honestly.

1. **Intent lens.** `interpretation` frames already arrive on the beat stream and are **deliberately
   dropped** in `PlayPage.onFrame` — half-rendering them somewhere they don't belong would be worse
   than waiting. Design: `docs/20_design_ux/mockups/mock_aux_lens_intent.png` (numbered ordered units,
   a per-unit edit affordance, a confidence line). *Rendering* is possible today from the frame;
   *editing* is not — per-unit correction has no endpoint. Chunk 7/8.
   ⚠️ Doc conflict to resolve first: the playbook ladder puts Intent/Inspect in **chunk 8**
   (`implementation_playbook_superpowers.md:74`); SPEC-023 says **chunk 7**
   (`open-spec-items.md:375`).
2. **Inspect lens.** `mock_aux_lens_inspect_artifact.png`. Needs a selection/focus seam plus the
   "You could…" suggested actions — and per D-14 those must be **backend-generated data tagged by
   kind**, never a hardcoded FE array. No endpoint yet.
3. **Known lens.** `mock_aux_lens_known_actor.png`. Feedable from `actor_page/1` today, but on an
   entity page it would duplicate what the dossier already renders — a second path for one job
   (D-14). Its real home is beside the scene, on selection, which means it waits for item 2.
4. **Aux docked ↔ full-screen control.** `AppShell` already supports `auxMode="docked" | "full"` with
   CSS bleed-out and one implementation (SPEC-023, tested). **Nothing in the app switches it** — the
   affordance is missing. Cheap and unblocked.
5. **Carrying overlay** (Artifacts+Carrying PRD AC#1/AC#3). Needs `GET /worlds/{w}/carrying` —
   specified in `mvp_slice_and_bridge.md` §4.1, never implemented.
6. **Graph Inspector (debug).** Named in chunk 4's build list, never built. Creator/debug-mode
   territory only (C-4).
7. **Images.** `ImageSlot` and `PortraitFrame` exist and render placeholders (D-8); **nothing
   subscribes to `image.ready`** because the async channel isn't implemented server-side (chunk
   13/14). Portraits stay silhouettes until then. Never re-request a portrait on a perception change —
   what changes with understanding is the text, not the face.
8. **World theme tokens (SPEC-019).** The FE should read a world's accent/mood/ornament as plain data
   (D-15's "tokens are the floor"). Needs `GET /worlds` to carry the field, so it rides SPEC-028.
9. **Corrections UX.** C-11 is **frozen**: invisible by default, no pending/approval UI ever, Continue
   implicitly accepts, an explicit lock is allowed, "Report issue" is the entry point. Chunk 8, no
   endpoints yet. Do not build an approval affordance under any circumstances.
10. **Module slots.** `scene.overlay` and `action.bar` exist as `AppShell` props taking rendered nodes.
    Manifests and the generic fragment renderer are **deferred to S4** — and note **M-8: writing the
    generic renderer now would itself violate D-14**, because it creates a second path for data that
    already has a native catalog component.
11. **`before_tick` timeline cursor.** The backend supports it (400 on malformed); the FE never sends
    it. No AC demands pagination — do it only if a real timeline gets long.
12. **DS primitives still missing:** `InputField` and `Collapsible`. Until they exist, `PlayPage`'s
    textarea and `ReasoningPanel`'s `<details>` are raw elements themed through `var(--dc-*)` tokens
    only (accepted stand-ins; the no-raw-color guard stays green).

---

## 4. Deliberate deviations from the mockups — decided, not forgotten

- **Timeline is a received-order spine, not the mockup's day columns.** Grouping into "Day N" columns
  means parsing structure out of a label string, which is world truth the FE does not get to derive.
  Revisit only if the backend sends day structure.
- **No collapsible knowledge topics with count badges.** The backend returns exactly **one** group per
  page, keyed by the target's own id, so the mockup's topics ("The informant", "Dark Foxes
  connection") have no source. Rides SPEC-029.
- **`KnowledgeList` renders `group_label` even when it equals the page title.** Payload rendered
  verbatim (D-7); the redundancy is the backend's single-group shape, not ours to second-guess.
- **Struck from the mockups on purpose, never to be built:** the "Relationship to you" panel and its
  trust slider (B-3/B-4, Actors AC#7/#8); "Add note" (parked, AC#10d); the Location hierarchy tree
  beside a breadcrumb and a "Part of" line (C-12 — one expression only); any "Linked to" panel
  (Locations AC#4); "Seen 1h ago" wall-clock phrasing (B-5); the gameplay mock's
  `Current | Previously | Open Threads` tab strip with High/Medium/Low severity (the four aux-lens
  mocks are authoritative; a fixed taxonomy and an urgency score are both banned).
- **Nav vocabulary is Glossary-only** — Actors, Locations, Artifacts, Timeline, Known World. `Entities`,
  `Possessions` and `Relationships` are adjudicated violations (B-3/GA-2/F-1) and a router test asserts
  their absence. `Corrections` and `Settings` are absent because their surfaces do not exist yet.

---

## 5. Traps for whoever picks this up

- **`verify:contract` is NOT in CI.** The workflow runs `verify:types`, `build`, `test` only; the
  contract gate is opt-in and needs the sibling backend checkout or network. **Run it by hand after any
  backend contract change** — nothing will fail otherwise, and drift will land silently.
- **Generated type names carry each schema's `title` sentence**
  (`SceneCurrent1WhereYouAreWhoIsPresentWhatMattersNowGETWorldsWSceneCurrent`). They are aliased **once**
  at the top of `src/api.ts`. Never hand-edit `src/types/` — `verify:types` diffs it byte-for-byte
  against codegen. If the backend shortens a title, re-run `npm run gen:types`.
- **`src/pages/lenses.ts` guesses label keys** (`perceived_name` → `label` → `name` → `title`) because
  the lens item shapes are unconstrained in the published schemas. Replace the guessing with the real
  field the day SPEC-029 pins those shapes.
- **The dev stubs are not committed.** Everything in this session was smoke-tested against two throwaway
  Node servers — a JSON stub for the compendium and an SSE stub emitting real `beat_frame/1` frames —
  written to `/tmp` and now gone. **Worth rebuilding under `scripts/dev/` and committing**, because a
  real backend needs Postgres, a seeded world and live LLM seats, and the FE otherwise has no way to
  exercise the play surface at all.
- **The play surface has never run against the real engine.** Every proof in PR #10 is against
  contract-shaped stubs, stated as such. The founder gate — *"leaves, gets interrupted, restates,
  arrives"* — is unrun.
- **Two keys guard the trace.** The server only sends `trace` frames in debug mode **and** the client
  needs `?trace=1`. Do not collapse that to one.
- **The play page is the only client of `POST /beats`.** If the backend changes that contract again,
  `src/api.ts` `streamBeat` is the single call site.

---

## 6. How to verify anything you change

```bash
npm ci
npm run verify:types      # src/types/ vs contracts/        (in CI)
npm run verify:contract    # contracts/ vs backend main      (NOT in CI — run it)
npm run build              # tsc (source + tests) && vite build
npm test                   # 133 tests
```

Then **drive it in a browser**. Every real defect this session — a duplicated heading, a duplicated
`h1`, a full-width chip, an input pushed off the bottom of the screen, chrome vanishing on an error
state — passed the test suite and was caught only by looking at the page.
