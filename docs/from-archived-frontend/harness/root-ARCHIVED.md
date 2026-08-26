# ARCHIVED — do not work in this repo

**This repo is superseded by [`dream-weaver-visuals`](https://github.com/zakkriel/dream-weaver-visuals).**
That is the live DreamChat frontend. Its dev port is **5273**. Port **5173 is retired with this repo.**

Authority: `dreamchat-world-backend/AGENTS.md:51`,
`dreamchat-world-backend/docs/30_architecture/system_map.md` §1, and `workspace:ADR-W003`
(`../docs/adr/ADR-W003_a_superseded_repo_is_archived_in_place.md`).

## The rule

Do not fix, build, deploy, or take a dependency on this repo. Frontend work goes to
`dream-weaver-visuals`. If you landed here because you were looking for "the frontend", that is the
expected mistake — this repo's name is the obvious guess and the live one is called
`dream-weaver-visuals` (its `package.json` name is the even less discoverable `tanstack_start_ts`).

## Last authored work: 2026-08-09

`dcab7ff`, 2026-08-09 18:41 — "Merge pull request #25 from zakkriel/docs/lovable-handoff-pack".
Nothing has been authored since; the later reflog entries are a fast-forward pull and a no-op
checkout.

## Why it is dead — checked, not asserted

**Its contract set is one to three generations behind.** `contracts/` holds nine schemas:

| Here | Live in `dream-weaver-visuals` |
|---|---|
| `world_directory.v1` | `world_directory.v2` |
| `scene_current.v2` | `scene_current.v4` |
| `beat_frame.v2` | `beat_frame.v5` |
| `carrying.v1` | `carrying.v1` — the one file still current |
| `actor_page.v2`, `location_page.v1`, `artifact_page.v1`, `timeline.v1`, `compendium_index.v1` | **dropped** — the live repo does not ship the Compendium page, index or timeline surfaces |

It carries **no** transcript, narration, world-genesis, kickstart, interview, world-refresh or
art-styles schema at all. The live repo vendors twelve, including all of those.

**Its stack is two majors behind.** React `^18.3.1` / Vite `^5.4.0` / Vitest `^2.1.9`, against the
live repo's React `^19.2.0` / Vite `^8.2.0` / Vitest `^4.1.10`. It is npm-based; the live repo is bun.

**Its CI was red on `main` and everyone learned to ignore it.** `verify:contract` diffed the stale
`contracts/` above against backend `main` and exited non-zero on every push and PR
(`../docs/90_archive/reports/QA-2026-08-11-frontend.md:99`,
`../docs/90_archive/reports/QA-SPAN-2026-08-11.md` §3). The workflow is now `workflow_dispatch` only.
It was **disabled rather than fixed** on purpose: an archived repo's `contracts/` is stale *by
design*, so a gate asserting otherwise asks a question with a known wrong answer — and a
permanently-red gate that everyone ignores teaches people to ignore gates.

## What it is still good for: provenance

Nothing here is deleted, because this repo is the record of how the predecessor worked.

- **`docs/20_design_ux/lovable-handoff/`** is the **origin** of the visual handoff pack now living at
  `dream-weaver-visuals/docs/handoff/`. The live copy is the one agents read; this is where it came
  from.
- **`docs/20_design_ux/gap-audit-2026-08-09.md`** is a read-only audit written after the founder
  rejected the look at `:5173`. Worth keeping.
- **`docs/superpowers/handovers/`** carries frozen rulings — e.g. "C-11 is frozen: no
  pending/approval UI ever" — that still bind the live frontend.
- **`src/`** shows six surfaces that were built and are not yet ported.

## Two claims this repo used to make, retracted

The old `AGENTS.md` said things that are now false and that a reader may have carried away:

1. It called itself "the canonical instruction set for *any* coding agent working in this repo." It is
   not. For frontend work that is `dream-weaver-visuals/AGENTS.md`; for anything crossing a repo
   boundary it is `../AGENTS.md` plus `../docs/00_workspace/`.
2. It said "There is no `/docs` tree here." There are two: `docs/20_design_ux/` and
   `docs/superpowers/`.
