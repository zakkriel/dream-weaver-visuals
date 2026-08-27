# Archived provenance — the predecessor frontend

**Historical records only. Nothing here is authority, and nothing here is wired into anything.**
These are closed, dated documents rescued from `dreamchat-frontend`, the archived predecessor of this
repo, before that repo can be deleted. They are kept because they record how the predecessor worked
and why several still-binding decisions were made — not because they describe this codebase. Where
anything here disagrees with the live repo, **the live repo wins**, every time.

Not built, not type-checked, not tested, not in `gen:types`, not in CI, not imported by any source
file. **Each of those is a mechanism, not a promise:** `tsconfig.json` scopes the typecheck graph with
`include: ["src/**"]`, and `vite.config.ts` scopes the test graph with `test: { dir: "src" }`. The
second one had to be added — `design-system/` carries 20 test files that vitest's repo-wide default
glob happily collected, and they took CI red for the life of the staging branch. That story is in
`../CONSOLIDATION-2026-08-26.md`.

This directory is exempt from the workspace's `archived-refs` gate by its own name
(`../../../harness/check.sh:330`), which is why references to the retired port 5173 and to
`dreamchat-frontend` survive inside it unbannered. That exemption is the reason the material lives
here rather than in a normal `docs/` path.

Consolidated 2026-08-26. The file-by-file verdict for everything that arrived, including everything
deleted, is `../CONSOLIDATION-2026-08-26.md`.

## What is in here

| Path | What it is |
|---|---|
| `gap-audit-2026-08-09.md` | The design gap audit written after the founder rejected the look. 366 lines, unique. Its durable half — the per-feature verdict on the mockups — was lifted to `../handoff/reference-vs-law.md`; this is the original, with the measurements. |
| `screenshots/2026-08-09/live/` | 15 PNGs, the audit's own evidence. `13-play-SKIN-fantasy.png`, `14-picker-SKIN-fantasy.png` and `15-dossier-SKIN-fantasy.png` are the proof for its central finding (audit §0.1). |
| `screenshots/2026-08-09/companion/` | 8 PNGs of `pixel-perfect-companion`, the founder's own Lovable build — "Reference B" in the audit. Seven of the eight routes are one shared "Coming soon" stub, so it is a *look* reference, never a *coverage* reference. |
| `2026-06-18-design-system-design.md` | The only written rationale for the `--dc-*` token contract this repo still runs on. `../../src/styles.css:11-12` names this spec's target file. |
| `frontend-handover-2026-08-08-excerpt.md` | Two passages from the last handover: the knowledge-grouping ruling, and the blocked-AC ledger with causes verified in backend SQL. |
| `design-system/` | The predecessor's hand-built design system, 88 files. **Held pending a founder decision** — see `design-system/DECISION-PENDING.md`. This is the only reason this directory is larger than a page. |

Two lessons from that handover were **not** archived, because they still bind: they are live at
`../contract-versioning.md`.

---

## The predecessor, in facts

Every line below is lifted from that repo's own `ARCHIVED.md`, which is still present at
`/Users/pelao/REPOS/dreamchat/dreamchat-frontend/ARCHIVED.md`. The staged copy this file replaces was
`harness/root-ARCHIVED.md`.

**Superseded, and the port went with it.** `dreamchat-frontend` is superseded by
`dream-weaver-visuals` — this repo, the live DreamChat frontend, dev port **5273**. Port **5173 is
retired with the predecessor.**

**Authority for that.** `dreamchat-world-backend/AGENTS.md:51`,
`dreamchat-world-backend/docs/maps/system_map.md` §1, and `workspace:ADR-W003`
(`../../../docs/adr/ADR-W003_a_superseded_repo_is_archived_in_place.md`).

**The discoverability trap, which cost real time.** If you went looking for "the frontend" and landed
in `dreamchat-frontend`, that is the expected mistake: its name is the obvious guess, while the live
repo is called `dream-weaver-visuals` and its `package.json` name is the even less discoverable
`tanstack_start_ts`. The workspace `AGENTS.md` opens with this for the same reason.

**When it died.** `dcab7ff`, 2026-08-09 18:41 — "Merge pull request #25 from
zakkriel/docs/lovable-handoff-pack". Nothing has been authored since; the later reflog entries are a
fast-forward pull and a no-op checkout.

**Why its CI gate was disabled rather than fixed.** `verify:contract` diffed that repo's stale
`contracts/` against backend `main` and exited non-zero on every push and PR
(`../../../docs/90_archive/reports/QA-2026-08-11-frontend.md:99` and
`QA-SPAN-2026-08-11.md` §3). The workflow became `workflow_dispatch` only, deliberately:

> an archived repo's `contracts/` is stale *by design*, so a gate asserting otherwise asks a question
> with a known wrong answer — and a permanently-red gate that everyone ignores teaches people to
> ignore gates.

**Six surfaces were built there and never ported.** Its `src/` still shows them. That is the honest
size of what this repo has not yet rebuilt, and it is the backdrop to the compendium question
answered in `../CONSOLIDATION-2026-08-26.md`.

### Two claims that repo made about itself, retracted

Recorded because a reader may have carried them away. The workspace pre-flight table names the first
one independently — `../../../AGENTS.md:139`, "`dreamchat-frontend`'s README is a confident runbook and
its old `AGENTS.md` claimed to be 'the canonical instruction set'":

1. Its `AGENTS.md` called itself "the canonical instruction set for *any* coding agent working in this
   repo." **It is not.** For frontend work that is this repo's `AGENTS.md`; for anything crossing a
   repo boundary it is the workspace `AGENTS.md` plus `docs/00_workspace/`.
2. It said "There is no `/docs` tree here." **There were two** — `docs/20_design_ux/` and
   `docs/superpowers/` — and they are the reason the repo was kept at all: provenance, not authority.

Its `README.md` was a confident three-service bring-up runbook for a dead repo, complete with a
PR/merge checklist for a repo that takes no PRs. Its own banner already neutralised it
("**⚠️ ARCHIVED — every command below is historical. Do not follow it.**"). The live bring-up is
`../../../stack.sh start`.

### One capability this repo does not have

The predecessor's `package.json` carried `"dev:fake-engine": "node scripts/dev/fake-engine.mjs"`. Per
its 2026-08-08 handover, the point of that stub was **the states the live engine cannot produce**:

> every journey halt, an `unresolved-same` pair that exercises the positional fallback, both failure
> regimes (a frame after the stream opens, a status before it), and a `slow` mode.

The script itself was deleted in the 2026-08-26 consolidation rather than moved, because it is the
same program as this repo's `../handoff/fixtures/mock-server.mjs` under a second name, and it emits
`world_directory/1`, `scene_current/2` and `beat_frame/2` — three dead versions. The capability is
recorded here; the file was not portable. See `../handoff/fixtures/README.md` for what the surviving
copy can and cannot do.

### Its stack, for scale

React `^18.3.1` / Vite `^5.4.0` / Vitest `^2.1.9`, npm-based, and **no styling dependency at all** —
hand-rolled CSS, its only runtime deps being `react` and `react-dom`. This repo is React `^19.2.0` /
Vite `^8.2.0` / Vitest `^4.1.10` on bun, with Tailwind v4 and 28 Radix packages. Nothing in the
predecessor's build config was portable, which is why none of it was kept.
