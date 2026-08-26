# HANDOVER — dreamchat-frontend (2026-08-08)

**Supersedes `2026-08-07-frontend-handover.md` entirely.** Where the two disagree, this one is right —
most of that document's "blocked" list is no longer blocked, and its central caveat ("the play surface
has never run against the real engine") is obsolete.

**State:** `main` = `8ab27ea`. Clean tree, **199 tests green**, `tsc` clean (source *and* tests),
`vite build` clean, `verify:types` OK, `verify:contract` OK against backend `main` — **and the contract
gate is now in CI**, which is the single biggest change to how this repo protects itself.

**Scope reminder:** this repo owns presentation only, never world truth (D-7). The law lives in
`dreamchat-world-backend/docs` (D-6) — cite rule IDs, never copy the docs here.

---

## 1. What shipped this session

| PR | What |
|---|---|
| #12 | Named the viewer on the scene read (a bare `#/play` was 500ing), aux docked↔full control, nav-rail height, and the first committed dev stub |
| #13 | The **Intent lens**, render-only, plus `InputField` and `Collapsible` retiring the last two raw-element stand-ins |
| #14 | Identically-labelled participants told apart for assistive tech; fixed every portrait announcing its name twice |
| #15 | Re-pin to **`beat_frame/2`** — `unresolved_candidates` became `[{id,label}]`, so the surface can finally ask "who?" out loud |
| #16 | Restored the Intent lens's better copy once `reference` went back to carrying the player's own phrase |
| #17 | The **world picker**, **theme tokens**, and the deletion of the `DEV_WORLD`/`DEV_PLAY_WORLD`/`DEV_PLAY_VIEWER` block |
| #18 | **Portraits.** `scene_current/2` + `actor_page/2`, tiered image URLs, and the end of the silhouettes |

---

## 2. Current truth

**The play surface has run against the real engine.** This is the sentence the last handover could not
write. Specifically, all of the following were driven in a browser, not inferred:

- **The founder gate passes.** Tavern → `go to Dock Street` (instant) → `go to the Harbormaster's
  Office` (a 5-leg journey) → four Continues → **arrived**. Restating mid-journey replaces the goal.
  There is no cancel or resume control anywhere, because leaving a journey is just typing (R5/R6).
- **A live world interruption was observed**: chip "Something cuts across your path.", the journey bar
  disappears, and the scene heading becomes a waystation that did not exist when you set out. The
  "cut-short" line names the goal you lost so restating does not depend on memory.
- **`UNRESOLVED` renders live.** A vague ask returns both options with their distinguishing detail, and
  typing one binds the right figure and commits. No candidate id ever reaches the DOM.
- **Portraits are real.** All present actors render actual PNGs at `?tier=thumbnail` (256px) in the
  participants strip and `?tier=preview` (768px) on the Actor dossier.

**Contract pins.** `beat_frame/2`, `scene_current/2`, `actor_page/2`, `world_directory/1`, and
`location_page`/`artifact_page`/`timeline`/`compendium_index` still at `/1`. All eight vendored in
`contracts/`, all eight codegen'd, both gates green.

⚠️ **The lesson worth carrying:** `beat_frame`'s own version held at `/2` while its *embedded* scene
def bumped to `scene_current/2`. A nested payload announces a change without moving the envelope's
version, so **"the version did not change" does not mean "the schema did not change."** `verify:contract`
caught it; nothing else would have.

**Routing is world-first.** Every world surface is `#/w/<id>/…`; the picker is the only surface with no
world. There is **no fallback world id anywhere** — a path that names a surface without naming a world
lands on the picker rather than guessing. `Route` is a union such that a surface needing a world cannot
compile without one.

**Nobody names a viewer.** The backend resolves the world's player from the world record, so whose
perception is rendered is world truth decided server-side. The `?viewer=` machinery is gone from the
play path. The compendium still forwards `?viewer=` as a read-only debug lens; the **trace still needs
two keys** (debug mode server-side *and* `?trace=1` client-side) and collapsing that to one is still the trap.

**Theme tokens.** The backend sends one accent, an atmosphere word and an ornament motif; the client
derives `accent-strong`, the focus ring, and `on-accent` as black-or-white by relative luminance so text
on an accent fill stays readable whatever colour a world picks. `mood`/`ornament` are deliberately
**not** validated — the raw value goes on `<html>` and CSS either has a block for it or does not, so an
unheard-of word degrades to base tokens by construction rather than by an allowlist someone has to keep
chasing. `accent` **is** validated, because unlike the other two it lands inside a CSS value.

**The dev stub** (`scripts/dev/fake-engine.mjs`, zero dependencies) now serves the world directory,
`scene/current`, both beat endpoints and an image route. Its real value is the states the live engine
**cannot** produce: every journey halt, an `unresolved-same` pair that exercises the positional
fallback, both failure regimes (a frame after the stream opens, a status before it), and a `slow` mode.
`--help` lists the keywords.

---

## 3. Traps for whoever picks this up

- **`verify:contract` IS in CI now.** It was the standing trap in the last handover and it has since
  caught two real drifts, so it earned a place in the workflow. It falls back to
  `raw.githubusercontent` when no sibling checkout exists, which is always true on a runner, and the
  backend repo is public so that works unauthenticated. **Consequence to know:** this is the one step
  whose result depends on another repository at the moment it runs — a backend contract change can turn
  a green PR here red without anyone touching this repo. That is intended. Drift should be loud.
- **Never hand-edit `src/types/`.** `verify:types` diffs it byte-for-byte against codegen. If a schema
  title changes, the generated union's name changes with it and the alias at the top of `src/api.ts`
  must follow.
- **Image URLs expire.** The payload carries a stable *path*; the backend 302s it to a presigned URL
  that dies in minutes. `imageUrl()` builds only the path, and **nothing in this client may ever store,
  cache or log a resolved image URL.** Putting one in state gives you a portrait that works on load and
  403s ten minutes later.
- **Never re-request a portrait on a perception change.** The URL derives from the payload's own path,
  so a rename leaves the `src` byte-identical and the browser never refetches. What changes with
  understanding is the text, not the face.
- **Pin exactly, never by family.** The `SchemaMismatchError` pin is a string equality check on purpose.
  Twice now a test's "alien" version has quietly become the valid one after a re-pin, silently testing
  nothing — when you bump a pin, bump the alien fixtures past it too.
- **`src/pages/lenses.ts` still guesses label keys** (`perceived_name` → `label` → `name` → `title`)
  because the lens item shapes remain unconstrained in the published schemas. SPEC-029 filled the
  lenses with data but did not pin those shapes; replace the guessing the day it does.
- **The narration panel grows without bound** within a session and has no clear affordance. Nobody has
  asked for one; noting it so it is a decision rather than an oversight.
- **`../dreamchat-frontend-play` worktree — leave it alone.** It holds the local
  `chunk-5.5-play-page` branch (clean, on merged `8b43160`), which is the only reason that branch still
  exists locally; `origin` is `main`-only. **A founder decision on it is pending** — do not remove the
  worktree or delete the branch until that lands.

---

## 4. Deliberate deviations — decided, not forgotten

- **Intent sits above Current, not behind a tab strip.** The mockup shows a four-lens strip; two of the
  four lenses exist, and a strip with two dead tabs is scaffolding. Intent is bounded while Current
  grows with every perception, so below it Intent would fall off the panel. The strip lands when the
  lenses do.
- **The Intent lens renders no confidence line.** The mockup shows "High (82%)". **There is no
  confidence field anywhere in `beat_frame/2`.** A number invented there would be a fabricated reading
  of the player's own words, which is the exact thing the lens exists to be honest about. If the line is
  wanted, it needs a payload field.
- **No per-unit prose descriptions and no nested/conditional units** in the Intent lens: the payload
  carries a kind tag and the player's `stated` words, and the chain is a flat ordered array with no
  branching.
- **Positional disambiguation (`(1 of 2)`) is the honest edge only.** The backend now puts
  distinguishing detail in colliding labels ("a hooded figure by the bar"), so most collisions never
  reach the fallback. A pair a viewer genuinely cannot tell apart keeps one identical label **by
  design** — that is the fiction working, not a bug. The rule lives once in `src/ds/labels.ts` and is
  shared by the participants strip and the halt chip, because if one said "(1 of 2)" while the other
  said "the first" a reader could not match them up.
- **Colliding labels are qualified in the ACCESSIBLE name only.** Numbering them on screen would invent
  a distinction the viewer does not actually perceive (B-1); position in the row is the whole of what
  separates them and is already visible.
- **Timeline is a received-order spine, not the mockup's day columns.** Grouping into "Day N" means
  parsing structure out of a label string, which is world truth the FE does not derive.
- **Struck from the mockups on purpose, never to be built:** the "Relationship to you" panel and its
  trust slider (B-3/B-4), "Add note" (parked), the Location hierarchy tree beside a breadcrumb (C-12 —
  one expression only), any "Linked to" panel, "Seen 1h ago" wall-clock phrasing (B-5), and the
  `Current | Previously | Open Threads` strip with High/Medium/Low severity (a fixed taxonomy and an
  urgency score are both banned).
- **Nav vocabulary is Glossary-only** — Actors, Locations, Artifacts, Timeline. `Entities`,
  `Possessions` and `Relationships` are adjudicated violations (B-3/GA-2/F-1) and a router test asserts
  their absence.

---

## 5. What stays deliberately unbuilt

Each names its blocker honestly. None of these is forgotten work.

1. **Inspect lens.** `mock_aux_lens_inspect_artifact.png`. Needs a selection/focus seam plus the
   "You could…" suggested actions — and per D-14 those must be **backend-generated data tagged by
   kind**, never a hardcoded FE array. No endpoint.
2. **Known lens.** Feedable from `actor_page/2` today, but on an entity page it would duplicate what the
   dossier already renders — a second path for one job (D-14). Its real home is beside the scene, on
   selection, so it waits for item 1. **When both land, introduce the four-lens tab strip with them.**
3. **Intent lens *editing*.** Rendering is done; per-unit correction has **no endpoint**, and an edit
   affordance that cannot edit is worse than none. The pencils stay absent.
4. **Corrections UX.** C-11 is **frozen**: invisible by default, no pending/approval UI *ever*, Continue
   implicitly accepts, an explicit lock is allowed, "Report issue" is the entry point. Do not build an
   approval affordance under any circumstances.
5. **Carrying overlay** (Artifacts+Carrying PRD AC#1/AC#3). Needs **`GET /worlds/{w}/carrying`** —
   specified in `mvp_slice_and_bridge.md` §4.1, still not implemented.
6. **Create-a-world.** `POST /worlds` exists but is **unauthenticated** while no session model does. A
   button on it would be this repo shipping a hole. The picker is read-only and a test pins the absence
   of any create form, input or button. Escalated; awaiting a ruling.
7. **The async channel.** `image.ready`, `projection.updated`, `backstage.applied`,
   `correction.window_closed` — none exist server-side. Portraits arrive in the payload on the next read
   and swap with no subscription, which is why nothing here waits on a socket.
8. **Module manifests and the generic fragment renderer.** `scene.overlay` and `action.bar` exist as
   `AppShell` props taking rendered nodes. Deferred to S4, and note **M-8: writing the generic renderer
   now would itself violate D-14**, because it creates a second path for data that already has a native
   catalog component.
9. **Graph Inspector (debug).** Creator/debug-mode territory only (C-4).
10. **`before_tick` timeline cursor.** The backend supports it; the FE never sends it. No AC demands
    pagination — do it only if a real timeline gets long.

---

## 6. How to verify anything you change

```bash
npm ci
npm run verify:types       # src/types/ vs contracts/        (in CI)
npm run verify:contract    # contracts/ vs backend main      (in CI as of this session)
npm run build              # tsc (source + tests) && vite build
npm test                   # 199 tests
```

Then **drive it in a browser** — see the README for the full stack and the offline stub. Every real
defect this session was found by looking at the page, not by the suite: a nav rail 276px tall in a
900px viewport, the Intent lens accusing every Continue press of being unreadable, `world_eruption`
telling the player they had snagged when the world had simply moved first, and two identical portraits
a screen reader could not tell apart. All four passed every test that existed at the time.

---

# ADDENDUM — 2026-08-09

Written at the close of the three-repo integration round, against
`../ROUND-CLOSING-REPORT-2026-08-09.md`. Everything below was verified in this repo or against the
live backend on `:8080` at the time of writing; nothing here is recalled.

## A1. Knowledge grouping changed under us, and the Mara dossier shows it

**What the backend changed.** `collected_knowledge_groups` now groups **per source event**. Every
group's `group_key` is `event:<uuid>` and its `group_label` is that event's own label. The envelope
did not move — `actor_page/2`, and the schema still says only `group_key: string` — so nothing in
`verify:types` or `verify:contract` could have caught it. This is the same lesson as `scene_current/2`
inside `beat_frame/2`, arriving from the other direction: **the schema did not change and the data
did.**

**The defect (FE-A).** Mara's dossier in the seeded Drowned Lantern renders **25 `<h3>` headings, all
reading "Arrival", each over exactly one item.** Measured, not estimated:

```
GET /worlds/2222…2222/compendium/actors/2ac70000-…-0000000000a2/page
  groups: 25 · distinct group_key: 25 · every key event:<uuid>
  group_label: {"Arrival": 25} · items per group: {1: 25}
```

and in the browser at `#/w/<w>/actors/<mara>`: `h3` count 25, distinct headings `["Arrival"]`, 25
list items. The seeded world has one in-world time label so far, so every source event carries the
same name and the per-event split is invisible except as repetition.

**Why nothing was changed here.** `KnowledgeList` renders `group_label` verbatim under `group_key`,
which is presentation of exactly what the payload said (D-7). Collapsing runs of identical headings
on the client is a rule about what those groups *mean* — whether two events sharing a label are one
section or two — and that is world truth. **A backend ruling is in flight** (relayed by the
integration coordinator). The two candidate outcomes and what each costs here:

| Ruling | FE change |
|---|---|
| Backend groups semantically (a group per *meaning*, not per event) | none — `KnowledgeList` already renders whatever it is handed |
| Backend keeps per-event groups and asks the FE to collapse repeats | `KnowledgeList` renders one heading per **run** of consecutive identical `group_label`s, merging their items; `group_key` stays the React key. Requires the backend to state that consecutive identical labels are the same section, because that sentence is the world truth the FE would be acting on |

Do **not** collapse on label equality without that sentence. Two events genuinely named the same and
genuinely distinct is a real case, and merging them would be the FE deciding an outcome (D-7, D-1).

## A2. Acceptance criteria: what this round actually met

From the closing report §3, kept here so the next reader does not have to reconstruct it.

**Newly MET this round** — these supersede every earlier report that lists them as owed:

- Actors AC#2, AC#3, AC#4.
- Locations AC#4, AC#5.
- The Actor portrait (`actor_page/2` at `?tier=preview`, PR #18).
- **The narration-card portrait (FE-B), PR #20** — the last place the "portraits live" claim
  overreached. `message.tsx` rendered `PortraitFrame` with no `src`, so speech and action cards wore
  silhouettes beside a strip and a dossier showing real faces.

**Still UNMEETABLE, cause verified in backend SQL — these are blocked, not forgotten:**

| AC | Blocker |
|---|---|
| Locations AC#2 | `part_of` is a stub |
| Locations AC#3 | `known_areas_inside` hardcoded `[]` |
| Artifacts AC#2 | type / location / holder all null |
| Artifacts AC#1, AC#3 | no `GET /worlds/{w}/carrying` — verified 404 |
| Timeline AC#4 | no version identity in the payload |
| Actors — role subtitle | `perceived_role` is NULL (still null on Mara today) |

Every one of these is a payload gap. None is worth an FE workaround: inventing any of them is
precisely the world truth this repo does not hold (D-7).

## A3. Doc corrections made in the same pass

- `message.tsx` cited an `image.ready` channel that does not exist server-side. Portraits arrive in
  the payload on the next read; that comment is gone (PR #20).
- `ParticipantStrip.tsx` still called its portraits placeholders. It has drawn real art since PR #18.
- `contracts/README.md` called the vendored set "the published Compendium contract" — it also holds
  `scene_current`, `beat_frame` and `world_directory` — and told the reader to run `verify:contract`
  manually on every PR. It has been in CI since PR #19.

## A4. Still true from the body above

Nothing in §§1–6 is retracted. `../dreamchat-frontend-play` and its `chunk-5.5-play-page` branch are
still awaiting a founder decision — leave both alone. The unbuilt list in §5 is unchanged except that
item 5 (**the Carrying overlay**) is about to unblock: the backend is landing
`GET /worlds/{w}/carrying`, and the overlay is the next thing to build against its schema.
