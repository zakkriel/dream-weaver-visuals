# play-surface · tech

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-2 · The play surface and the core loop ·
**Parent bounded context:** Compendium & Play UX

This file holds how the domain is built — the route, the render path, validation, traps.
`play-surface.product.md` holds what it means; `play-surface.seams.md` holds what crosses its
boundary.

Line numbers are as of 2026-08-27; re-locate by grep before relying on one.

---

## Where the code lives

Verified against `git ls-files`, 2026-08-27:

- **`src/routes/w.$worldId.play.tsx`** — Surface 3, wiring only: *"this route decides what data
  reaches the screen and in what state"* (its own header, `:102-108`). Holds `groupStageLines`
  (`:124`) and the halt-reason mapping `haltCopy` (`:51`).
- **`src/lib/rp-text.ts`** — the asterisk convention, display only. `rpSegments` splits a line into
  prose and action runs; unclosed `*` and empty `**` stay as typed.
- **`src/api/history.ts`** — the record: `loadHistory`, the paging reducer, `Remembered`. Its header
  is the one home for record-vs-projection and beat-not-line (`:3-25`).
- **`src/components/dc/PlayStage.tsx`** — **Lovable's directory, but the render path `Voiced`
  (`:69`) and the transcript scroll/prepend behaviour (`:366-390`) live here.** See Traps.
- Tests: `src/laws/history.test.ts`, `src/laws/transcript.test.ts`.

## The read path

- `GET /worlds/{w}/scene/current`, `GET /worlds/{w}/transcript` (viewer-scoped, newest first,
  `?before=<entry_no>` until `next_before` is null), `POST /worlds/{w}/beats` and `/beats/continue`
  (a stream of beat frames; Continue carries no body — `src/api/index.ts:281-285`).
- Pins are exact string equality against the `const PIN` block in `src/api/index.ts:67` — **do not
  restate versions in prose**; `AGENTS.md` §Data records the incident where its own restated
  versions went stale three-for-three.
- History is read through `loadHistory` in `src/api/load.ts`, never `fetchHistory` directly, so
  fixture mode is respected. A failed history read **never** falls back to the bundled capture
  (`AGENTS.md` §The record).

## The render path

One path for history and live, on purpose: a narration segment is
`{speaker_id, speaker_label, kind, text, quote}` byte-identical in `beat_frame/5` and
`transcript/2`, and `Voiced` in `PlayStage` renders both. `groupStageLines` folds arrival-ordered
lines: grouping on `speaker_id` never label (`B-1`, `w.$worldId.play.tsx:119-122`); a run never
crosses the remembered/live seam (`:141-144`); a remembered line keeps the silhouette (`:162-164`).

Transcript behaviour a restyle must not break (`AGENTS.md` §The transcript, the one home; verified
in `PlayStage.tsx`):

1. **The scroller is one element** (`.dc-transcript`) — history and live share it.
2. **The record's status lives OUTSIDE the scroller** — inside, a prepending page shifts the text
   the reader is looking at by its own height. *"That was measured, not guessed."*
3. **Older pages are prepended**; the reader's position is restored by **distance from the bottom**
   (`PlayStage.tsx:366-390`). Follow-newest only when the reader is already at the bottom; respects
   `prefers-reduced-motion`.

## Technical decisions already made

| Id | What it settles | What breaks if you ignore it |
|---|---|---|
| `D-14`, `ADR-P019` | One rendering path per job; data + kind tag from the backend, catalog of components on this side; unknown `kind` falls back to plain prose, never an invented attribution. | A second path for the same data is the drift machine `D-14` exists to prevent. |
| `AGENTS.md` §The asterisk convention | Display only. What is sent and stored keeps every character as typed. | Stripping punctuation on the way out edits the player's intent. |
| `AGENTS.md` §Prose and speech | **Never render `text` unconditionally** — roughly half of live speech arrives bare. | An empty paragraph above half the dialogue. |
| `AGENTS.md` §The transcript, rule 1 | Stored labels are frozen at delivery; the backend pins that with its own tests (`D-7`). | "Fixing" an old label to today's name rewrites what the viewer was told. It is not a bug. |
| `AGENTS.md` §The law tests | Provenance rule: any JSON a route can reach declares a `schema_version` or is an asset descriptor under `src/assets/`. | Somebody's imagination typed into a file becomes indistinguishable from the world. |
| `F-2` | Halt reasons and every other engine token are mapped to player sentences before the screen (`haltCopy`). | Engine vocabulary on screen. |

### What you may not decide alone

1. **Anything visual.** `src/components/dc/` and `src/components/ui/` are Lovable's; if a component
   is wrong, say so — never restyle it here (`AGENTS.md` rule 1).
2. **A new displayed value or endpoint.** That is a backend field request, a normal and welcome one
   (`docs/handoff/README.md` §3.1 rule 2) — never a client-side fill.
3. **Relaxing either transcript rule** (frozen labels, no portrait on memory). Backend-pinned.
4. **The play rail's four inert controls.** Left at "needs a ruling" by three 2026-08-26 reviews —
   see Open questions.

## Validation for this domain

`bun run test` (vitest, scoped to `src/` by `test.dir` in `vite.config.ts`), plus `bun run
typecheck`, `bun run verify:types`, `bun run build`; `bun run verify:contract` needs the sibling
clone or network. All five run in CI (`AGENTS.md` §Gates).

- **What counts as evidence here:** the page. `AGENTS.md` §Gates closes with: *"every real defect
  in this project's history was found by looking at the page, not by the suite."* Drive the play
  route in a browser against the live backend before claiming a behaviour works.
- **What counts as ceremony here:** the law tests are static and cannot read the meaning of a value
  that arrives as data — the invented dashboard came back with fabricated content moved from
  `src/fixtures/` to `src/mocks/` and every rule passed (`AGENTS.md` §The law tests). A green law
  suite on this surface proves wording, not truth.
- The specific behaviour suites: `src/laws/history.test.ts` (grouping, bare speech at `:282-287`,
  asterisk convention incl. parts-sum-back at `:368-381`), `src/laws/transcript.test.ts`.

## Traps, with receipts

| The trap | The receipt |
|---|---|
| **Behaviour lives in a Lovable-owned file.** `Voiced` and the scroll rules are in `src/components/dc/PlayStage.tsx`; the seam is behaviour-vs-look, not a directory line, exactly there. | `AGENTS.md` §The seam vs `PlayStage.tsx:69,366`. Wiring happens by passing typed props — if you are editing that file's behaviour, say so; if its look, stop. |
| **Restating pins in prose.** | `AGENTS.md` §Data: this file once claimed three versions the code did not pin. Read the `PIN` block. |
| **Rendering `text` unconditionally.** | Test at `history.test.ts:282-287`; browser check counts blank paragraphs. |
| **`tick` cannot order the transcript** — several entries share one; `entry_no` is the handle and the cursor. | `src/api/history.ts:27`. |
| **A fallback that hides breakage.** Fixture fallback is refused on 404 and on schema mismatch, and history never falls back at all. | `AGENTS.md` §Data, §The record: a stale capture of a story is *"a different story, shown to a reader as their own memory."* |
| **`stated` null vs `""`.** Null is a Continue press; empty string is typed nothing. Collapsing them lies about what the player did. | `src/api/history.ts:22-23`. |

## Open questions

1. **The play rail's four inert controls** — the one live violation of the no-dead-navigation rule,
   found by all three 2026-08-26 reviews and left at "needs a ruling" (`digest/S11` Topic 27).
2. **Where does the play-loop UX law live now?** The live UX loop document
   (`20_design_ux/core_ux_loop_and_aux_sidebar.md` — granularity hierarchy, participant rule,
   correction window, the warrant example) is no longer in the backend tree (verified 2026-08-27:
   `git ls-files` returns nothing for `*design_ux*`). Its content survives only in `digest/S09`.
   Whoever can rule should name the surviving canonical home.
3. **Who owns the Aux sidebar?** UX-2's spec includes it (five screen zones, four lenses), but only
   two lenses exist and the built aux/carrying surface is specified in the compendium pack
   (surface 9). Boundary against UX-1 unclear; recorded, not resolved.
