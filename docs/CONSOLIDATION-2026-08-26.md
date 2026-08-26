# Consolidation — the archived frontend's docs, 2026-08-26

> **Provenance record.** This is the verdict, file by file, on 218 documents rescued from
> `dreamchat-frontend`, the **archived predecessor** of this repo, and staged unedited under
> `docs/from-archived-frontend/` by commit `dd123b4`. That directory no longer exists. Everything
> below names a dead repo, dead file paths and the retired dev port 5173 on purpose: it is the record
> of what was superseded, and it is the only place several of these facts survive.

**What this round did.** Every one of the 218 staged files was given a verdict — 105 deleted as
byte-identical duplicates or superseded ancestors, 113 moved into `90_archive/` as closed dated
records — and the staging directory was removed. Four of the staging README's own claims were measured
and found false, three of which were its stated reason for keeping material. Four of its five open
decisions are answered here with evidence; the fifth, the design system, is reserved to the founder
with the evidence written down beside the material.

Nothing in `contracts/` or `scripts/` was touched. Nothing in `90_archive/` is built, type-checked,
tested, in `gen:types`, in CI, or imported by any source file — a property that was **not** true when
this round started and is now enforced rather than asserted; see *One defect found and fixed* below.
Beyond `docs/` and `AGENTS.md`, that fix is the round's only change: two lines in `vite.config.ts`.

## Disposition

| | Files | Bytes |
|---|---|---|
| **DELETE** — byte-identical duplicate or superseded ancestor | 105 | 31,044,895 (29.6 MiB) |
| **MOVE** into `90_archive/` | 113 | 1,134,778 (1.1 MiB) |
| **Total staged** | **218** | **32,179,673 (30.7 MiB)** |

Measured with sha256 and `git cat-file` against `dd123b4` on 2026-08-26. The 16 mockup PNGs alone are
29,588,017 bytes — **95% of everything deleted, 92% of everything staged.**

---

## The four corrections

Each was a claim in the staging README. Each is measured, not argued. Three of the four were the
stated reason to keep material, which is why they are the most load-bearing part of this document.

### 1. "The mockup PNGs are the largest unique asset and exist nowhere else." — FALSE

All 16 PNGs are **byte-identical by sha256** to `../dreamchat-world-backend/docs/20_design_ux/mockups/`
at the same relative paths. The table is below; it is the evidence for the deletion.

Two live documents already said they must not be vendored here:

- `docs/handoff/README.md:216-217` — "**Mockups are not bundled.** They live in the
  `dreamchat-world-backend` repo at `docs/20_design_ux/mockups/`."
- the staged audit's own scope note, now `90_archive/gap-audit-2026-08-09.md:8-10` — "the mockups stay
  in `../dreamchat-world-backend/docs/20_design_ux/mockups/` and are referenced by path, never
  vendored", citing rule **D-6**.

So the premise was false *and* the action it justified was already prohibited.

### 2. "The fake engine has no live equivalent." — FALSE

There is **one program under three names**, and the live copy is the descendant:

| Copy | Newlines | Knows port 5273 |
|---|---|---|
| `harness/scripts/dev/fake-engine.mjs` (staged) | 432 | no |
| `docs/20_design_ux/lovable-handoff/fixtures/mock-server.mjs` (staged) | 432 | no |
| `docs/handoff/fixtures/mock-server.mjs` (**live**) | 440 | **yes** |

The two staged copies are byte-identical to each other by sha256. The live copy is the same program
plus one hunk — the CORS allowlist gains `http://localhost:5273` and `http://127.0.0.1:5273`, a change
that can only have been written after the predecessor was archived.

### 3. The superpowers docs are "mostly duplicated in the backend." — FALSE for all six

The backend has **no design-system document at all**, and its two topically-near chunk-4 files exclude
the frontend leg by governance rule:
`../dreamchat-world-backend/docs/superpowers/plans/2026-06-15-chunk-4-compendium-read-only-backend.md:13`
— "The frontend leg (`dreamchat-frontend`) is a **separate** plan and PR … (D-7/D-10)."

They are superseded by **this repo**, not duplicated by the backend. That changes the verdict's
reasoning but not its outcome for five of the six; it is why the sixth was archived rather than
deleted.

### 4. Design system: "Only 8 of the 91 exist in this repo by name."

Exact-basename matches against `src/components/{dc,ui}/` are **3**: `Button`, `Badge`, `Collapsible`.
The figure 8 requires counting five role-alike renames — `PortraitFrame`→`dc/Portrait`,
`Panel`/`MetaPanel`→`dc/DashboardPanel`, `NavRail`→`dc/SideRail`+`dc/DashboardRail`,
`InputField`→`ui/input`, `Divider`→`ui/separator`. Recorded as **3 by name, 8 by name-or-role.**

### A fifth figure, corrected in passing

The staging README's count of 45 byte-identical `lovable-handoff` files is **correct as measured
against `dd123b4`**. A re-measurement against the working tree returns 44, because this round itself
edited the 45th — `docs/handoff/fixtures/README.md` gained the status banner described under decision
3. Recorded so the next person to re-run the audit does not read their own change as drift.

---

## The mockup checksum table

Re-proven on 2026-08-26 before the deletion was taken, per the plan's gate: any `DIFFER` row would
have been moved to `90_archive/mockups/` instead of deleted. **All 16 read `MATCH`.** Left column is
the shared sha256; the path is relative to both
`docs/from-archived-frontend/docs/20_design_ux/mockups/` (deleted) and
`../dreamchat-world-backend/docs/20_design_ux/mockups/` (survivor).

```
MATCH 8b45954825d0fc807db0566c81b29383e715f849e1d600d6cd829373ffdc56ef  mock_aux_lens_current.png
MATCH c05b8b2a0f4b04f26cb36bda2ca3b159bf45797fc2b07824ee51e83092d3fab4  mock_aux_lens_inspect_artifact.png
MATCH a8621ebc67f8251ae610a0b83ceceb845b4e76b56c918be94eaae63990a41cd1  mock_aux_lens_intent.png
MATCH c3f64efc4ad206115cb54924eb51681b079e11d6834bccb64fac8a8bc03ae177  mock_aux_lens_known_actor.png
MATCH 658b3c8e020f934a2f3ea8fc32755a8aff6b0c2ebeeb5cdb55e838987f928406  mock_compendium_actor_seren_v1_superseded.png
MATCH c5873a4500c6ac2b5e913656b2d1825af4a91dbc232b012a441762e923d26991  mock_compendium_actor_seren_v2.png
MATCH bd5d664415768b3f059df78c544d3c825c8e2cc62edfc38567be0c2735048bf4  mock_compendium_location_dawnfall_market.png
MATCH 386e9ab4a97926b0a6b244e1b4ab4eb1d0e0a53f12793e373d988e6c12f0a9b0  mock_compendium_timeline.png
MATCH 04ef84fdd729db1251f6e4d6c90cea6b1c1aba9684316016d9da74391b2dcd20  mock_gameplay_screen.png
MATCH dcc17a11383977540542aa9e52ebaf3d7d32b4df786f31777fea06e59288c1da  unsorted_concept_art/58f59681-d2fa-4f98-974d-356944763243.png
MATCH 2f24cb9a1764c881add78ecf7af5b29930c0a99daaf14b1cc32ac981b2028e1e  unsorted_concept_art/78473b47-ab46-4fad-b15a-43c162147980.png
MATCH 2144d8273557b62841562a53fba4ad7abf905fcf6e900a99b8c3be8d536eb99d  unsorted_concept_art/86f5ec19-a28c-467a-9d9f-aede2e117210.png
MATCH a42371a4ce86576ba0f0e8ca6729d7bc1169e8b5770a60579af4de1e1bc3987e  unsorted_concept_art/8ccf6f9c-4406-4e18-ad12-4f0d3c965de2.png
MATCH de13dbffbdd4932c96442a30fa954f6a6e18db831e8345738a4d173dd1f5f14b  unsorted_concept_art/9e3b31d2-bf49-43bc-80ce-2a95e0d1be63.png
MATCH ae6591455546bdd63be75f9393a458b9899de45016b1d0ea13f34f4ca1b06290  unsorted_concept_art/ChatGPT Image Jun 5, 2026, 02_50_58 PM (1).png
MATCH 8df271da34a9ff973c94648f59aefdff5bb5e5e303fb320059cf854f6dd96f4e  unsorted_concept_art/ae64f0df-f373-40cd-a395-55cba63bf410 (1).png
```

**Three independent copies survive this deletion:** the backend at `docs/20_design_ux/mockups/`
(checksum-proven above), the archived sibling repo still on disk at
`/Users/pelao/REPOS/dreamchat/dreamchat-frontend/`, and this branch's parent commit `dd123b4`.

---

## The verdict table

One row per staged path, or per group where the whole group shares one reason. **A row with no
citation is not a verdict** — every row carries the `path:line` or the checksum result that decided
it. Staged paths are relative to `docs/from-archived-frontend/`; destinations are relative to `docs/`.

### Moved — 113 files

| Path | Verdict | Destination | Reason |
|---|---|---|---|
| `docs/20_design_ux/gap-audit-2026-08-09.md` | KEEP-OLD | `90_archive/gap-audit-2026-08-09.md` | 366 lines, unique, and a dated closed decision document — exactly what `../harness/check.sh:321-327` blesses keeping as "an accurate historical record". Moved verbatim; its dead paths (`src/ds/`, `src/pages/`, `:5173`) are **not** rewritten, because the directory name carries the gate exemption and editing a closed record falsifies it. Its durable half was extracted, not moved — see MERGE below. |
| `docs/20_design_ux/screenshots/2026-08-09/live/` (15 png) | KEEP-OLD | `90_archive/screenshots/2026-08-09/live/` | All 15 unique by sha256 and cited as the audit's own evidence. `13-play-SKIN-fantasy.png`, `14-picker-SKIN-fantasy.png`, `15-dossier-SKIN-fantasy.png` are the proof for its central finding (audit lines 46-56). |
| `docs/20_design_ux/screenshots/2026-08-09/companion/` (8 png) | KEEP-OLD | `90_archive/screenshots/2026-08-09/companion/` | All 8 unique by sha256. This is "Reference B", the founder's own Lovable build, and the audit's per-feature verdicts cite it by filename. |
| `docs/superpowers/specs/2026-06-18-dreamchat-design-system-design.md` | KEEP-OLD | `90_archive/2026-06-18-design-system-design.md` | The **only written rationale for the `--dc-*` token contract this repo still runs on**, and citable from live code: `src/styles.css:11-12` names this spec's target file. Unique content is lines 20-37 (D-7/GA-3/D-8/B-5/B-3/B-4/F-1/F-2 argued *as design-system constraints*), 39-47 (rejected alternatives) and 49-68 (the semantic token contract and the `prefers-reduced-motion` rule). §§4, 5 and 7 are superseded and left in place — it is a closed dated record. |
| `design-system/**` (88 files, 224,203 B) | KEEP-OLD | `90_archive/design-system/` | **Held, not resolved.** Decision 2 below. Evidence both ways is at `90_archive/design-system/DECISION-PENDING.md`. |

### Merged into live documents

| Source | Verdict | Destination | Reason |
|---|---|---|---|
| `docs/20_design_ux/gap-audit-2026-08-09.md` §3 | MERGE | `docs/handoff/reference-vs-law.md` (new) | The per-feature verdict on the mockups and the reference build is **current, actionable guidance addressed to the design tool**, unlike the audit's measurements of a codebase that no longer exists. It is a new file rather than a fold into `docs/handoff/README.md` because that README §3 is a frozen 2026-08-09 law snapshot cited by `AGENTS.md:46` as "the law list", and it already carries only 2 of the audit's 11 struck rows. The thirteen rules are **not** restated. |
| `docs/superpowers/handovers/2026-08-08-frontend-handover.md:44-48, 215` | MERGE | `docs/contract-versioning.md` (new) | The only currently-binding engineering facts in the whole staged set that exist in no live document: a nested payload can change without the envelope's version moving, and a grouping's meaning can change without the shape moving. Live and first-class, not archived, because both still bind. Pointed at from the **Data** section of `AGENTS.md`. |
| `docs/superpowers/handovers/2026-08-08-frontend-handover.md:205-239, 241-266` | MERGE | `90_archive/frontend-handover-2026-08-08-excerpt.md` (new) | The knowledge-grouping ruling with its standing prohibition ("Do **not** collapse on label equality without that sentence"), and the blocked-AC ledger whose causes were verified in backend SQL rather than assumed. Archived rather than live because both describe in-flight state of another repo. **One row is marked stale inline**: Artifacts AC#1/AC#3 ("no `GET /worlds/{w}/carrying` — verified 404") is obsolete — that endpoint shipped, and `src/api/index.ts` pins `carrying/1` via `fetchCarrying()`. A false row is not silently carried. |
| `harness/root-ARCHIVED.md` (+ `root-AGENTS.md`, `root-README.md`, `root-package.json`) | MERGE | `90_archive/README.md` (new) | The death commit `dcab7ff` (2026-08-09 18:41, "Merge pull request #25 from zakkriel/docs/lovable-handoff-pack"), the reason the predecessor's CI gate was disabled rather than fixed, the six built-but-never-ported surfaces, the two retractions that repo made about itself, and the one capability this repo lacks. **The death commit is in no live document; it is the reason that file was written.** |

### Deleted — 105 files

| Path | Verdict | Survivor | Reason |
|---|---|---|---|
| `docs/20_design_ux/mockups/**` (16 png, 29,588,017 B) | DELETE | `../dreamchat-world-backend/docs/20_design_ux/mockups/` | 16/16 `MATCH` by sha256, table above. Vendoring here is prohibited by **D-6** per `docs/handoff/README.md:216-217` and the audit's own scope note. This overrides the staging README's "they exist nowhere else". |
| `docs/20_design_ux/lovable-handoff/` — 45 of 48 | DELETE | `docs/handoff/` at the matching name | Byte-identical by sha256 against `dd123b4`. Includes all 9 surface `.md`, all 10 surface screenshots, all 9 contract schemas, all 12 fixture payloads, the 3 fixture assets, `port-back.md`, and `fixtures/README.md`. |
| `docs/20_design_ux/lovable-handoff/README.md` | DELETE | `docs/handoff/README.md` | Body identical from "For a UX/design tool" onward; only the banner differs, and **the staged banner defers to the live copy** — "This is the ORIGIN of the pack now living at `dream-weaver-visuals/docs/handoff/`. **That copy is the one agents read**". The live banner is strictly richer: it adds `workspace:ADR-W003`, roots the rules in the backend register under D-6, and corrects the port to 5273. |
| `docs/20_design_ux/lovable-handoff/contracts/README.md` | DELETE | `docs/handoff/contracts/README.md` | Body identical from "These are **verbatim copies**" onward. The live copy adds a 25-line **HISTORICAL SNAPSHOT** banner (`docs/handoff/contracts/README.md:3-27`) with the full old→live mapping and an explicit retraction of its own next sentence. The staged copy asserts that retracted sentence with no banner: it is **actively misleading**, so keeping the older one would be a regression. |
| `docs/20_design_ux/lovable-handoff/fixtures/mock-server.mjs` | DELETE | `docs/handoff/fixtures/mock-server.mjs` | Pre-5273 ancestor. Correction 2 and decision 3. |
| `docs/20_design_ux/screenshots/2026-08-09/after-pass1/` (10 png) | DELETE | `docs/handoff/surfaces/screenshots/` at the matching name | 10/10 byte-identical by sha256. |
| `harness/contracts/*.schema.json` (9) | DELETE | `docs/handoff/contracts/` | 9/9 byte-identical by sha256. All nine are stale versions besides; decision 4. |
| `harness/contracts/README.md` | DELETE | — (not ported) | **Not** the same document as `docs/handoff/contracts/README.md`: it is the dead repo's *root* `contracts/` guide — `# Vendored API contract`, npm-era, `src/types/`, 9 stale versions. Its two durable ideas already exist live, at `docs/handoff/contracts/README.md` and `scripts/verify-contract.sh:15-17`. The live root `contracts/` has no README at all; if one is wanted it should be written fresh, and since `contracts/` is gate-frozen that is its own round. |
| `design-system/skins/{base,fantasy,moods}.css` (3) | DELETE | `docs/handoff/{base,fantasy,moods}.css` | 3/3 byte-identical by sha256. Noted in `90_archive/design-system/DECISION-PENDING.md:14-16` so the moved tree still reads whole at 88 files rather than 91. |
| `docs/superpowers/handovers/2026-08-07-frontend-handover.md` (150 ln) | DELETE | its own successor | Decided by that successor's first line — `2026-08-08-frontend-handover.md:3`: "**Supersedes `2026-08-07-frontend-handover.md` entirely.**" |
| `docs/superpowers/handovers/2026-08-08-frontend-handover.md` (282 ln) | MERGE→DELETE | `docs/contract-versioning.md` + `90_archive/frontend-handover-2026-08-08-excerpt.md` | Four passages survive (rows above). The rest is dead-path archaeology or already restated live: image-URL expiry → `docs/handoff/README.md:163-166`; never re-request a portrait → rules 10-11; pin exactly → `AGENTS.md` § *Data*; colliding labels → `docs/handoff/README.md:182-183`; struck mockup items → rule 5's vocabulary table; corrections frozen → rule 7. |
| `docs/superpowers/plans/2026-06-15-chunk-4-compendium-frontend.md` (1691 ln) | DELETE | — | Builds `src/api.ts`, `src/pages/*`, a zero-dependency hash router and `#/actors` routes. **None exists live.** Its two surviving artifacts, `verify-contract.sh` and `verify-types.sh`, are already live and current. |
| `docs/superpowers/plans/2026-06-18-design-system-skins.md` (2055 ln) | DELETE | — | Builds `src/ds/`. Its `data-skin`/`setSkin` architecture was **not adopted** — a grep of live `src/` returns nothing. Its token block exists live in evolved form in `src/styles.css`; its rationale survives at `90_archive/2026-06-18-design-system-design.md`. |
| `docs/superpowers/specs/2026-06-15-chunk-4-compendium-frontend-design.md` (181 ln) | DELETE | — | Every decision is now live law in stronger form, and one has **inverted**: its debug `?viewer=` passthrough (lines 23-25) is now banned by `docs/handoff/README.md:168-170` rule 12, enforced at `src/laws/laws.test.ts:207-209`. Keeping it would preserve a spec that contradicts an enforced rule. |
| `harness/root-ARCHIVED.md` | MERGE→DELETE | `90_archive/README.md` | Harvested first (row above). Source still on disk at `/Users/pelao/REPOS/dreamchat/dreamchat-frontend/ARCHIVED.md`. |
| `harness/root-AGENTS.md` | DELETE | `90_archive/README.md` | Its only unique content is two retractions, duplicated at `root-ARCHIVED.md:62-70` and carried forward. |
| `harness/root-CLAUDE.md` | DELETE | — | Two lines, pure pointer — and its second line repeats the "canonical entry point" claim that `root-AGENTS.md` itself withdraws. |
| `harness/root-README.md` | DELETE | `../stack.sh` | The "confident runbook" `../AGENTS.md:139` warns about. Its own banner already neutralised it: "**⚠️ ARCHIVED — every command below is historical. Do not follow it.**" Its §Contract paragraph is internally stale too, claiming five published schemas where that repo held nine. |
| `harness/root-package.json` | DELETE | `90_archive/README.md` § *Its stack, for scale* | Not portable, and the deltas are recorded: React 18→19, Vite 5→8, Vitest 2→4, npm→bun, and the old app had **no styling dependency at all**. Its one interesting line, `"dev:fake-engine"`, is recorded with the capability it provided. |
| `harness/root-tsconfig.json` | DELETE | — | 10-line React-18/Vite-5 config with no path aliases. Live uses `vite-tsconfig-paths` plus TanStack Start scaffolding. |
| `harness/root-vite.config.ts` | DELETE | — | 11 lines; its only substance is `proxy: { "/worlds": BACKEND_URL }`, already documented in `AGENTS.md`. Live port 5273 comes from the Lovable config, not from a portable setting — and `AGENTS.md` forbids adding plugins to `vite.config.ts` anyway. |
| `harness/root-vitest.config.ts` | DELETE | — | 9 lines, jsdom plus a `src/test/setup.ts` that does not exist here. |
| `harness/github-workflows/ci.yml` | DELETE | `.github/workflows/ci.yml` | Archived and already disabled — line 14 `name: CI (archived — manual only)`, trigger `on: workflow_dispatch:` at lines 15-16. The live workflow runs on push and PR, on bun, and adds `bun run typecheck`, which the staged one lacks. |
| `harness/scripts/verify-contract.sh` | DELETE | `scripts/verify-contract.sh` | Pins 9 stale schemas and hardcodes an absolute machine path. Live pins 12 current schemas and resolves the sibling clone via `${DREAMCHAT_BACKEND_SCHEMA:-…}`. The live script was **not** touched. |
| `harness/scripts/verify-types.sh` | DELETE | `scripts/verify-types.sh` | Maps 9 schemas to `src/types/`; live maps 12 to `src/api/types/`. The live script was **not** touched. |
| `harness/scripts/dev/fake-engine.mjs` | DELETE | `docs/handoff/fixtures/mock-server.mjs` | Byte-identical to the other staged copy; Correction 2 and decision 3. |
| `README.md` (the staging index) | DELETE | this file | Its four claims are corrected above and its five questions are answered below. Keeping an index of a directory that no longer exists would be the exact failure this round removes. |

---

## The five decisions

### 1. One authoritative set — done

The verdict table above is it. 105 files gone, 113 in `90_archive/` as provenance, two new live
documents (`docs/contract-versioning.md`, `docs/handoff/reference-vs-law.md`), one new archive index
(`90_archive/README.md`). `docs/from-archived-frontend/` no longer exists.

### 2. The design system — reserved to the founder, held reversibly

**Not answered here, deliberately: it is a product judgement, not a mechanical one.** The 88-file tree
is at `90_archive/design-system/`, unwired, and the evidence both ways is at
`90_archive/design-system/DECISION-PENDING.md` — 7 reasons for, 8 against, five salvage subsets
sized from 6 files to 88, and the deletion trigger. Highlights on each side: the 5 `.woff2` binaries
are the only self-hosted webfonts in the workspace and the one category here that cannot be
regenerated from prose; against that, nothing in the tree can run in this repo (no
`@testing-library/react`, no jsdom) and the tokens were already lifted in the opposite direction —
`src/styles.css:11-12` says so in its own header.

This directory is the only reason `90_archive/` is larger than a page. That is accepted: the evidence
is worthless without the material.

### 3. The fake engine — one program under three names; the live copy survives, flagged non-working

`docs/handoff/fixtures/mock-server.mjs` survives at its current path; both staged copies are deleted.
Correction 2 is the evidence.

**It does not work, and that is now stated where a reader lands before trying it.**
`docs/handoff/fixtures/README.md` gained a status banner under its H1: the server emits
`world_directory/1`, `scene_current/2` and `beat_frame/2`; the live client pins later versions of all
three in the `const PIN` block of `src/api/index.ts`; `getJson()` compares `schema_version` by exact
string equality, so pointing the app at it throws `SchemaMismatchError` on the **first** read. It also
serves no `/transcript` and no `/carrying`, both of which the live client reads.

**Its payloads were deliberately not updated in this round.** Re-emitting four payload families at
current versions is a code change with its own verification, not documentation consolidation. The cost
is stated; the work is not smuggled in.

### 4. The five unvendored contracts — UNBUILT, not a dead surface, and not vendored

`actor_page.v2`, `artifact_page.v1`, `compendium_index.v1`, `location_page.v1` and `timeline.v1`
describe a feature **not yet built here**. They stay where they already are, in
`docs/handoff/contracts/`. **None is vendored into `contracts/`.** Three independent lines of evidence:

- **The backend serves all five today.** `../dreamchat-world-backend/core/api/main.go:45-52` —
  `newRouter()`, documented as "the ONE list of served routes", registers `fn_actor_page`,
  `fn_location_page`, `fn_artifact_page`, three `NewIndexHandler` kinds and `NewTimelineHandler`.
  `core/api/router_coverage_test.go:19-21`, re-measured 2026-08-26, names "the Actor/Location/Artifact
  pages, the compendium indexes, the timeline" and adds "Every one of those is a surface a player looks
  at."
- **This repo's absence is deliberate and has a stated return condition.**
  `src/routes/w.$worldId.index.tsx:258-260` — "The Glossary's four compendium destinations are
  deliberately absent until those surfaces exist." `src/components/dc/DashboardRail.tsx:11-13` —
  "Those four return here the day those surfaces do; naming them now would be four more dead buttons."
- **Seven captured fixtures are already staged and pin-current.** `src/fixtures/actor_page_mara.json`
  and `actor_page_viewer.json` declare `actor_page/2`; `index_actors.json`, `index_artifacts.json` and
  `index_locations.json` declare `compendium_index/1`; `location_page.json` declares
  `location_page/1`; `timeline.json` declares `timeline/1`. Each matches the backend's current schema,
  and **none is imported by `src/api/fixture-mode.ts` or anywhere else** (grep returns 0 hits). A dead
  surface leaves stale captures and removed routes; this has fresh captures and live routes.

The rule against vendoring early is already written in the repo — `scripts/verify-contract.sh:15-17`:
"Scoped to the contracts the built surfaces actually consume. Add a file here the same commit a
surface starts reading it — a pin on a payload nothing renders gates on nothing."

**The checklist for whoever builds the first compendium surface**, per `AGENTS.md` § *Data*, all in one
commit:

1. the vendored schema in `contracts/`,
2. a `gen:types` entry,
3. the committed generated type,
4. an entry in **both** `scripts/verify-types.sh` and `scripts/verify-contract.sh`,
5. a `PIN` entry in `src/api/index.ts`,
6. entries in the `PINS` and `SCHEMA_OF` maps of `src/laws/fixtures.test.ts`.

`world_refreshed/1` once shipped pinned and enforced with none of the five, which is why
`../harness/check.sh pin-vendored` now exists.

### 5. Deleted outright — the 105 files above

Every one is a byte-identical duplicate with a named survivor, or a superseded ancestor with the
citation that supersedes it. Nothing was deleted on a judgement of taste.

---

## One defect found and fixed — the staged docs had turned CI red

**This is the one change in this round outside `docs/` and `AGENTS.md`,** and it is reported here
rather than folded in quietly.

`vitest`'s default glob is repo-wide. `tsconfig.json` declares its scope as `include: ["src/**"]`, but
nothing declared the test scope, so the moment `dd123b4` landed the predecessor's docs in this repo,
vitest began collecting the 20 `*.test.tsx` / `*.test.ts` files inside the staged design system. They
import `@testing-library/react`, which is not a dependency here, and they assume a DOM. Measured on
2026-08-26 in a detached worktree, same `node_modules`:

| Commit | Result |
|---|---|
| `4f83a05` — before the staging commit | **5 files, 140 tests, green** |
| `dd123b4` — the staging commit | **20 files failed**, 6 tests failed, 140 passed |
| this branch, before the fix | identical to `dd123b4` — inherited, not introduced |
| this branch, after the fix | **5 files, 140 tests, green** |

`.github/workflows/ci.yml:28` runs `bun run test`, so CI was red on push and PR for every one of those
commits.

**The fix is `test: { dir: "src" }`**, added to `vite.config.ts` inside the wrapper's documented
`vite: { … }` passthrough with a `/// <reference types="vitest/config" />` for the type. No plugin was
added, so `AGENTS.md` rule 3 holds. It states the test graph is `src/` — the same scope
`tsconfig.json` already states for the typecheck graph, which is why the 88 archived `.ts`/`.tsx`
files never reached `tsc`.

It is config rather than a `--dir src` flag on the `test` script so that `bunx vitest run` behaves the
same as `bun run test`; both were verified. This is also what makes the claim in
`90_archive/README.md` — "not built, not type-checked, not tested" — true by mechanism rather than by
assertion, which matters because that directory keeps 20 test files that cannot run here.

---

## Two findings recorded, not fixed

Both are outside this round's scope — one is code, one is another repo — and neither is a documentation
change. Recorded so they are not lost.

### `src/components/dc/PlayStage.tsx:495-498` — four ghost nav controls

Inside `<nav aria-label="World navigation">`, four items labelled Timeline / Actors / Locations /
Artifacts are rendered as `<Button variant="ghost">`, not `<Link>`. They have no `onClick` and no
route: **they navigate nowhere.** These are precisely the "four more dead buttons" that
`src/components/dc/DashboardRail.tsx:11-13` refuses to add, and they are against
`docs/handoff/README.md:172-174` rule 13.

`src/laws/laws.test.ts` catches dead `href="#"` links, so a `<button>` with no handler slips straight
through the gate that exists for this. **Needs a ruling:** either wire them when the compendium
surfaces land (decision 4) or drop them until then — plus a law test that covers handler-less controls
inside a `<nav>`, since the rule is currently enforced only against one of the two ways to break it.

### `../harness/check.sh:342` — an exclusion for a path that no longer exists

`--exclude-dir=from-archived-frontend` was added 2026-08-26 for the directory this round removes. It is
now a stale entry in the workspace's own map. Harmless — `90_archive/` is already covered by
`--exclude-dir=90_archive` at line 330, which is what makes this round's destinations legal — but the
workspace `AGENTS.md` pre-flight is explicit that a map describing a shape that changed gets amended in
the same change. This one cannot be: it is a **workspace-repo** change, so it is a separate branch and
PR by the round protocol.
