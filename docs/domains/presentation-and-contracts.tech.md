# presentation-and-contracts · tech

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-3 · The frontend as a repository ·
**Parent bounded context:** Compendium & Play UX

This file holds how the domain is built — the contract chain, the read path, validation, traps.
`presentation-and-contracts.product.md` holds what it means; `presentation-and-contracts.seams.md`
holds what crosses its boundary.

Line numbers are as of 2026-08-27; re-locate by grep before relying on one.

---

## The contract chain

Every payload comes through `src/api/`; nothing else fetches (`AGENTS.md` §Data).

- **`contracts/`** — 12 vendored schemas, byte-identical to
  `dreamchat-world-backend/core/api/schema/` (`ADR-W004`; re-verified with `cmp` on all 12,
  2026-08-27). The workspace gate is `../harness/check.sh contract-drift`; the in-repo gate is
  `bun run verify:contract` (`scripts/verify-contract.sh` — reads the sibling clone, else backend
  `main` raw).
- **`src/api/types/`** — codegen from `contracts/`. **Never hand-edited**: `scripts/verify-types.sh`
  regenerates into a temp dir and diffs byte-for-byte, *"which is what makes 'never hand-edit the
  generated types' enforceable rather than a request"* (its own header).
- **The `const PIN` block, `src/api/index.ts:67`** — the one pin table. **Do not restate the
  versions anywhere**; `AGENTS.md:66-68` carries the receipt: this section once claimed three
  versions the code did not pin, *"so an agent trusting this file would have targeted three wrong
  versions."* Not a family check on purpose: *"reading v3 data through v2 field access is the
  failure mode this exists to make impossible"* (the block's own comment). A re-pin is a re-vendor:
  schema, `gen:types`, pin, both verify scripts, and re-captured fixtures, in one commit.
- **The five-artifact rule** — every pin has a vendored schema, a `gen:types` entry, a committed
  type, and an entry in BOTH verify scripts. Since 2026-08-27 this is **a review obligation, not a
  gate**: `../harness/check.sh pin-vendored` enforced it and was deleted for reading only this tree;
  the rule is now checklist item 9 in `docs/areas/contracts-and-platform.md`
  (`docs/00_workspace/failure-log.md` #8). The receipt is unchanged: `world_refreshed/1` shipped
  pinned with none of the five.
- **`src/fixtures/`** — captured payloads only, every one declaring `schema_version`;
  `src/laws/fixtures.test.ts` pins each capture to the client's pin (`PINS`) and each pin to its
  vendored schema's `$id` (`SCHEMA_OF`), *"so a stale capture fails on purpose."*

## The read path

- `getJson` (`src/api/index.ts:182`): 404 → `NOT_FOUND` (one sentinel, no withheld-vs-nonexistent
  distinction — `B-1`, `I-3`); other failure → throw; version ≠ pin → `SchemaMismatchError`.
- **Four rungs** for where the backend is (`src/api/index.ts:110-128`, table in `AGENTS.md`):
  `VITE_API_BASE` → hosted hostname → localhost proxy → fixture mode. **Rung 2 is
  `HOSTED_API_BASE` in `src/api/hosted.ts`, committed on purpose**: *"It is a public URL, not a
  secret — the browser sends it in every request anyway — and committing it is the only thing that
  works in the Lovable preview, which builds this repo without injecting custom `VITE_*` variables"*
  (`hosted.ts:4-7`). The hosted test is deliberately broad, not an allowlist — a wrong guess is
  loud, a missing pattern is silent (`hosted.ts:17-21`).
- **Fixture fallback** (`src/api/load.ts`): only the directory read sets fixture mode, in either
  direction; a resolved base takes fixture mode off the table. Never on 404 (*"a missing world must
  read as missing"*), never on schema mismatch, and **never for history**: for a story, a stale
  capture is *"a different story — words this viewer may never have been told, presented as their
  own memory"* (`load.ts:169-171`).

## The law tests

`src/laws/` runs in CI and is *"the reason a design tool can push to `main` without a human reading
every diff"* (`laws.test.ts:12`). They scan **what a route can reach**: the walker starts at
`src/routes/` and follows imports (`laws.test.ts:34-61`); an unrouted component cannot violate
anything on screen.

The **provenance rule** (rule 2, `D-7`, `laws.test.ts:304-364`) closes the data-shaped hole the
static rules cannot see — the invented dashboard came back as data with every wording rule passing —
by requiring every route-reachable JSON to declare a `schema_version` (a captured payload) or live
under `src/assets/` (an asset descriptor). **`PENDING_RULING`** (`laws.test.ts:329`) is the sanctioned
exemption for a known offender awaiting a decision; it is empty, its one-ever entry was the invented
dashboard mock, and a second test fails any exemption that outlives the import it excuses.

## Technical decisions already made

| Id | What it settles | What breaks if you ignore it |
|---|---|---|
| `ADR-W004` | The workspace owns the both-sides contract check; a published version is superseded, never deleted; a schema change is a cross-repo round. | The deleted-not-superseded incident: `verify:contract` caught it *only because the files vanished*. |
| `D-4` | Exact-string pins; mismatch fails the load. | Silent misreads across a version bump. |
| `ADR-W003` | The predecessor repo and port 5173 are retired; this repo is the live frontend. | Working in `dreamchat-frontend` is "the expected mistake". |
| `D-6` | This repo's docs restate the law and never own it; ids resolve in the backend register. | A local copy of a rule is the copy that goes stale. |
| `D-7` + failure-log #8 | The five-artifact review obligation (see §The contract chain). | A pin drift-checked by nothing. |

### What you may not decide alone

1. **Vendoring a new schema or moving a pin** — a cross-repo round (`ADR-W004`); early vendoring
   forbidden (`verify-contract.sh:15-17`).
2. **Relaxing or editing a law test** — *"the test is right until proven otherwise"*
   (`port-back.md` §Tests).
3. **Merging or collapsing on value equality** — grouping/ordering meaning is *"world truth and the
   backend's to state"* (`docs/contract-versioning.md`). Ids, never labels.
4. **Adding a fixture fallback path** — the 404 / history / mismatch exclusions are the design
   (§The read path).
5. **Touching Lovable's directories** (`AGENTS.md` §The seam, rules 1-4).

## Validation for this domain

`bun run verify:types` · `bun run verify:contract` · the `src/laws/` suites via `bun run test`
(vitest is scoped to `src/` — the archive's 20 dead test files are excluded by mechanism) · from the
workspace root, `../harness/check.sh contract-drift`.

- **What counts as evidence here:** a gate that reads *bodies*, not version strings.
  `verify:contract` alone caught a nested schema moving under an unchanged envelope version
  (`docs/contract-versioning.md` incident 1). A green typecheck and an unchanged pin table prove
  nothing about a contract.
- **What counts as ceremony here:** the provenance law and its staleness companion **assert
  `[] === []` today**. The walker follows only `@/` imports (`laws.test.ts:39`), the only production
  `@/…json` importer is `src/api/fixture-mode.ts`, and `load.ts:29` imports it *relatively* — so
  `importedJson()` returns empty (re-verified by grep, 2026-08-27). Both tests are
  green and neither can go red. The rule's *intent* still binds; its guard does not. Corroboration
  that once lived in deleted reviews is now at `docs/CONSOLIDATION-2026-08-26.md` §"Two findings
  recorded, not fixed" (ghost nav); the walker's primary receipt is the dated grep above.

## Traps, with receipts

| The trap | The receipt |
|---|---|
| **A doc restating a pin is a doc lying about a pin.** | `AGENTS.md:66-68` — §The contract chain is the one home. |
| **A pin can be exact and stale twice over:** nested version not moving; meaning moving under a stable shape. No gate catches the second. | `docs/contract-versioning.md`, both with incidents. |
| **A guard checks a spelling, not a behaviour.** The dead-link law greps `href="#"`; four handler-less `<Button>` nav controls pass it (`src/components/dc/PlayStage.tsx:495-498`, verified present). The provenance law's walker is vacuous (§Validation). | `docs/CONSOLIDATION-2026-08-26.md` §"Two findings recorded, not fixed" (ghost nav). |
| **The law tests scan UI copy, and code must move around them.** `NoTemplateError` is named to avoid the literal "new World" tripping the create-affordance ban — the name moves, not the law. | `src/api/index.ts:88-95`, its own comment. |
| **Early vendoring gates nothing.** | `scripts/verify-contract.sh:15-17`. |
| **A hand-authored mock beside captures is indistinguishable from one.** `dashboard.mock.json` was moved out of `src/fixtures/` for exactly this. | `src/laws/fixtures.test.ts:72-78`. |

## Open questions

1. **The four inert play-rail controls** — wire when the compendium surfaces land, or drop? Left at
   "needs a ruling" by `docs/CONSOLIDATION-2026-08-26.md` §"Two findings recorded, not fixed"; plus
   the missing law test for handler-less controls in a `<nav>`.
2. **`docs/handoff/port-back.md` is bannerless and describes a dead codebase** ("no Tailwind",
   `src/ds/**` destinations); its protocol is intact. Three sibling handoff docs got banners in the
   2026-08-26 round; this one did not. Banner, rewrite, or archive is a ruling.
3. **Auth exists in code and not in the record.** `src/api/auth.ts` ships a bearer-token layer
   (`POST /auth/login`, 401 → login gate, `Authorization` header on every read) — while SPEC-021's
   confirmed CORS contract says *"no credentials … no `Authorization`"* and SPEC-028 says no session
   model exists. Both sides recorded; which document supersedes which needs a ruling.
4. **The lost mock-server capability** — twelve engine states unreachable on demand
   (`CONSOLIDATION-2026-08-26.md` decision 3). Repair is its own round; is it wanted?
