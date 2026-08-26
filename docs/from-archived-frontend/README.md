# From the archived frontend — staging, pending consolidation

**What this is.** Everything of value from `dreamchat-frontend`, the **previous** DreamChat frontend,
moved here so that repo can be deleted without losing anything. That repo is archived and read-only on
GitHub as of 2026-08-26; this repo (`dream-weaver-visuals`) is the live frontend, dev port **5273**.

**Status: STAGING. Not authoritative, not built, not gated.** Nothing here is wired into this repo's
build, its `gen:types`, or its contract-drift gate. It is raw material for a consolidation round.

**Nothing was overwritten.** Every path here is new. The live `contracts/` and `scripts/` are untouched
and remain the only gated ones.

---

## What is in here

| Directory | Contents | Note |
|---|---|---|
| `docs/20_design_ux/` | 98 files — the UX mockups, screenshots, the Lovable handoff, `gap-audit-2026-08-09.md` | The mockup PNGs are the largest unique asset and exist nowhere else |
| `docs/superpowers/` | 6 files — handovers, plans, specs | Mostly duplicated in the backend; the consolidation round decides |
| `harness/contracts/` | 10 vendored schemas | **Older versions** than the live ones — `beat_frame.v2` vs live `v5`, `scene_current.v2` vs live `v4`, `world_directory.v1` vs live `v2`. Do not copy these over the live ones |
| `harness/scripts/` | `verify-contract.sh`, `verify-types.sh`, `dev/fake-engine.mjs` | The two verify scripts exist live and are current. **The fake engine has no live equivalent** |
| `harness/github-workflows/ci.yml` | the old CI | Reference only |
| `harness/root-*` | the dead repo's `AGENTS.md`, `README.md`, `package.json`, vite/vitest/tsconfig | Provenance, and the build config the old app used |
| `design-system/` | 91 files — `catalog/`, `primitives/`, `composed/`, `skins/`, `gallery/` | **Code as reference, not to be built.** Only 8 of the 91 exist in this repo by name |

## The five contracts this repo does not vendor

`actor_page.v2`, `artifact_page.v1`, `compendium_index.v1`, `location_page.v1`, `timeline.v1`.

Worth knowing before the consolidation round: these are the Compendium surfaces. Their absence here may
mean the feature is unbuilt in the live frontend rather than that the contracts are dead.

## Why the dead repo existed, kept because it cost real time

`dreamchat-frontend` is the trap the workspace `AGENTS.md` opens with: its name is the obvious guess for
"the frontend" while the live repo is called `dream-weaver-visuals`, and this repo's `package.json` name
is the even less discoverable `tanstack_start_ts`. The supersession was recorded in exactly one line of
one file in a third repo, and every other artifact still pointed at the dead one — including
`stack.sh start`, which booted it.

The repo's owner did not recognise the name `dream-weaver-visuals` when asked. That is the strongest
available evidence that the naming still costs more than a rename would.

## What the consolidation round must decide

1. **One authoritative doc set.** 84 of the 104 documents here are duplicated in this repo or the
   backend. Which version wins, and where does it live.
2. **The design system.** Reference worth keeping, or the approach that was replaced. This is a product
   judgement, not a mechanical one.
3. **The fake engine.** It has no live equivalent; this repo uses
   `docs/handoff/fixtures/mock-server.mjs`. Keep one, name it, delete the other.
4. **The five unvendored contracts.** Unbuilt feature, or dead surface.
5. **What may be deleted outright**, so this directory does not become a permanent attic.

Until those five are answered, this directory stays exactly as it arrived — unedited, so the
consolidation round is diffing real history rather than someone's summary of it.
