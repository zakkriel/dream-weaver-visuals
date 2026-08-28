# presentation-and-contracts · seams

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-3 · The frontend as a repository ·
**Parent bounded context:** Compendium & Play UX

A seam belongs to two domains, so it gets its own file. Each row declares an expectation — one side
owns a fact, the other consumes it and must not re-derive or re-decide it. Packages never cross repos
(`ADR-W007`); several rows below cross a repo boundary, which is exactly why they are written down.

---

## What this domain consumes

| Direction | Domain | What crosses | The expectation |
|---|---|---|---|
| consumes | **Compendium surfaces** (UX-1, backend) | pinned JSON payloads, published at `dreamchat-world-backend/core/api/schema/` | The backend publishes; this repo vendors byte-identically and pins (`ADR-W004`). Consumed **verbatim, never re-derived**: no regrouping, no label-equality merging, no invented names or counts (`D-7`; `docs/contract-versioning.md` is the one home for the meaning-drift rule). Only the transcript and carrying contracts of UX-1's set are vendored today (versions: the `const PIN` block, `src/api/index.ts`); the five compendium contracts stay unvendored until a surface reads them (`product.md` §Deliberately not built). |
| consumes | **Perception & knowledge** (WE-3, backend) | perception-scoped payloads, through every read | *"No surface reads canon (`B-1`). Hidden truth is absent from the payload, not hidden by the UI"* — WE-3's seams row names Platform & Contracts as the consumer. This side's half: one `NOT_FOUND` sentinel, no withheld-vs-nonexistent distinction, no client-side knowledge check (`I-3`). |
| consumes | **Art & image seam** (backend) → Image Platform | a stable asset `path` + tier query, redirected server-side to a signed URL | Build image URLs **only** from the payload's `path`; never store, cache, log or inline a resolved URL (rule 11). Never key an image off a label or bust cache on a text change (rule 10, `D-8`). Art arriving later is a payload change, *"never something this client subscribes to or polls for"* (`src/api/index.ts:38-41`). |
| consumes | **World genesis** (WE-10, backend) | the world-directory payload (version: the `const PIN` block, `src/api/index.ts`), creation/refresh/genesis payloads | The directory is perception-bound one level up: an unreachable world is *absent, not redacted* (SPEC-028). A directory is never world state. |

## What this domain provides

| Direction | Domain | What crosses | The expectation |
|---|---|---|---|
| provides | **Play surface** (UX-2, this repo) | typed payloads through `src/api/`, and the law-test fence | *"Every payload comes through `src/api/`. Nothing else fetches"* (`AGENTS.md` §Data). Wiring is typed props, never restyling. UX-2 owns the transcript-record behaviour (`src/api/history.ts`, `src/laws/history.test.ts`, `src/laws/transcript.test.ts`); this domain owns the transport and its fallback exclusions (`tech.md` §The read path). Glob overlap recorded in both `.map` proposals for the moderator. |
| provides | **Lovable** (external tool, not a domain) | the freedom to push to `main` | The law tests are *"the mechanism that lets a design tool push to `main` without a human reading every diff"*. The strike table (`docs/handoff/reference-vs-law.md`) governs what of the founder's own mockups must not be built; the thirteen rules bind through the backend ids they cite. |
| provides | **Compendium surfaces** (UX-1) | the vendoring checklist for the five unbuilt contracts | When the first compendium surface lands: five artifacts + `PIN` entry + `PINS`/`SCHEMA_OF` entries in `src/laws/fixtures.test.ts`, all in one commit (`CONSOLIDATION-2026-08-26.md` decision 4). This side must not vendor early; that side must not change a published schema outside a cross-repo round (`ADR-W004`). |

## The seams that do not exist

- **No push channel.** Nothing streams backend→frontend outside a beat submission's own frames; art,
  names, and state arrive by the next read. Do not add polling or subscriptions for images
  (`src/api/index.ts:38-41`).
- **No session seam — and the code has moved first.** SPEC-021's confirmed CORS contract says no
  credentials cross this boundary; `src/api/auth.ts` now sends `Authorization: Bearer` and gates on
  401. A contradiction awaiting a ruling, recorded in `tech.md` §Open questions — do not build
  further on either side of it without asking.
- **The Electron door.** SPEC-020/SPEC-024: the configurable API base is *the only seam* keeping a
  desktop wrapper possible. Nothing may hardcode a backend URL outside the four-rung ladder.
- **The aux `D-14` catalog.** The register's `D-14` names backend-generated actions and `aux delta`
  frames; no payload carries them yet. An agent adding client-side "You could…" verbs is improvising
  across this missing seam — the verbs land the day the payload carries them.
