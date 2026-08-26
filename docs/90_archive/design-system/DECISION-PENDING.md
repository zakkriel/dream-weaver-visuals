# The predecessor's design system — held, pending one founder decision

**Archived reference. Not built, not tested, not imported, and it cannot compile in this repo as it
stands.** This directory is the hand-built design system from `dreamchat-frontend`, the archived
predecessor frontend. It is kept because the question it poses is a **product judgement and not a
mechanical one**, and the judgement is worthless without the material.

**The question, in one line:** is this tree reference worth keeping, or is it the approach that was
already replaced?

This file takes no side. It sets out what was measured, both ways, so the founder can answer it in
minutes rather than re-derive it. Everything below was measured on 2026-08-26 against this repo.

**Three of these files were deleted on the way in** — `skins/base.css`, `skins/fantasy.css` and
`skins/moods.css` were byte-identical to `../../handoff/base.css`, `fantasy.css` and `moods.css`. Read
them there. That is why the count below says 91 and the directory holds 88.

---

## What is here

91 files as it arrived, ~227 KB, summing exactly:

| Class | Count | Bytes |
|---|---|---|
| Component `.tsx` (non-test) | 37 | ~85 KB |
| Test files | 20 | ~38 KB |
| CSS | 25 | ~33 KB |
| Non-test `.ts` (`index`, `labels`, `skins/index`, `skins/theme`) | 4 | ~8.9 KB |
| `.woff2` binaries | 5 | **94.0 KB** |

By directory: `primitives/` 37.3 KB (19 components, 9 tests) · `composed/` 49.5 KB (13, 6) ·
`catalog/` 15.1 KB · `gallery/` 6.2 KB · `skins/` 18.1 KB · `skins/fonts/` 94.8 KB.

**41% of the bytes are font binaries.** 5.5% of the files.

---

## Evidence FOR keeping it

1. **These are the only self-hosted webfonts in the workspace.** A repo-wide glob for `**/*.woff2`
   with gitignore disabled returns exactly the five files in `skins/fonts/` and nothing else. This
   repo loads its type from a third-party CDN — `../../../src/routes/__root.tsx:106`. Font binaries
   are the one category here that cannot be regenerated from prose.
   **The caveat cuts the other way:** the staged skin specifies **EB Garamond**
   (`skins/fantasy.css:19`, now at `../../handoff/fantasy.css`) while this repo renders **Cormorant
   Garamond**. Adopting these files is a visual change, not merely a hosting change.
2. **20 behavioural render tests, against 0 in this repo.** A glob for `src/**/*.test.*` returns only
   the five `src/laws/*.test.ts` source scanners. This repo has 56 components — 46 vendored shadcn
   plus 10 authored `dc/` — and not one component render test.
3. **Accessibility reasoning captured as an executable assertion.** `primitives/media.test.tsx:20-28`,
   with its rationale intact: *"A silhouette that kept `role="img"` with an empty name would be an
   unlabelled image in the tree, which is worse than no image at all"* — then asserting
   `aria-hidden="true"` and no `role` for an empty alt.
4. **Two rules tested by RENDER that the live laws test only by text scan.**
   `composed/refactor.test.tsx` holds `it("NotFound stays a single identical view")` asserting
   `expect(a).toBe(b)` — withheld and nonexistent must be byte-identical on screen, which is an
   information-leak defence this repo has **no rule for at all**. And
   `it("Timeline renders records in received order (no client sort)")` asserting
   `expect(order).toEqual(["Second", "First"])`, where live `src/laws/laws.test.ts` catches the same
   rule only with a regex over source text.
5. **No component gallery exists in this repo.** `gallery/Gallery.tsx` mounts every primitive with a
   runtime `<select aria-label="Skin">` skin switcher. `src/routes/` has six entries, none a
   design-system route, and `package.json` has no Storybook.
6. **Five CSS declarations with no live counterpart** — from the fantasy skin, now at
   `../../handoff/fantasy.css:30-39`: `--dc-atmosphere` (a two-layer radial+linear gradient),
   `--dc-scene-scrim`, `--dc-panel-sheen`, `--dc-glass-blur`, and `--dc-status-high/med/low`.
7. **Domain phrasing tables with no live counterpart.** `catalog/epistemic.tsx:80` — `decayNote` is
   *"the one sanctioned phrasing, shared with every other surface that renders decay so they cannot
   drift apart."* `composed/composed.test.tsx:32` encodes the null-labelled-remainder grouping
   contract for Collected Knowledge, which is untested live.

## Evidence AGAINST keeping it

1. **Nothing here can run in this repo.** `package.json` has no `@testing-library/react`, no
   `@testing-library/jest-dom`, and no jsdom or happy-dom. All 20 test files open with
   `import { render, screen } from "@testing-library/react"` and use jest-dom matchers. Making the
   tree runnable means adding three dev dependencies and a jsdom test environment this repo has
   deliberately never needed.
2. **Two tests would throw on collection, not merely fail.** `skins/fantasy.test.ts:5` reads
   `src/ds/skins/fantasy.css`; `skins/skins.test.ts:39` reads `index.html`. Neither path exists here.
3. **A structurally different styling mechanism.** This tree is plain CSS with BEM classes
   (`dc-btn--primary`, `dc-shell__rail`) aggregated by a 26-line `@import` closure — `styles.css:2`
   calls its transitive import set "the entire DS look". This repo is Tailwind v4
   (`src/styles.css:1-3`), 28 Radix packages, `cva` + `cn()` — see the 200-character utility
   className at `src/components/dc/OrnateFrame.tsx:16`. Adopting the staged CSS means running two
   styling systems side by side.
4. **The tokens were already lifted, in the opposite direction.** `src/styles.css:11-12` states:
   *"Every value below is a --dc-* custom property so the whole block can be lifted verbatim into
   dreamchat-frontend/src/ds/skins/fantasy.css."* The live block is the newer, larger revision —
   794 lines against the staged skin's 37 — and adds `--dc-font-ui`, `--dc-divider`, `--dc-gutter`,
   `--dc-shadow-3`, `--dc-inset-highlight` and `--dc-radius-xl`, plus full type and space scales.
5. **`skins/theme.ts` is already reimplemented live.** `src/lib/world-theme.ts:38-66` derives the same
   accent triplet from the same SPEC-019 payload by the same sRGB relative-luminance method, and
   writes `data-mood`/`data-ornament` with the same pass-through-unknown-words doctrine.
6. **Rule coverage is a live win, not a gap.** Grepping this whole tree for
   `BANNED|relationship|wall-clock|toLocale|trust|affinity|severity` yields four hits, and every one
   is a prose comment — never an assertion. `src/laws/laws.test.ts` executes thirteen rule families
   over the reachable-from-routes module graph. **This tree adds zero executable rules.**
7. **The overlap is minimal, so "reference" has little to reference.** Exact basename matches against
   `src/components/{dc,ui}/` are three: `Button`, `Badge`, `Collapsible`. Staged `Button.tsx` is
   385 bytes against this repo's 1.8 KB cva/Slot version, and the median non-test primitive is
   ~600 bytes. Little here would take long to rewrite.
8. **41% of the bytes are fonts, and the fonts do not need the other 86 files.** `skins/fonts/fonts.css`
   is a self-contained five-rule `@font-face` block with relative `./*.woff2` URLs and no imports.

---

## If the answer is "keep some of it" — the salvage subsets

A through C are CSS and binary only. They add nothing to the typecheck or test graph and cannot break
a build. From D upward the tree stops being droppable-in and becomes reading material.

| | Contents | Files | Bytes |
|---|---|---|---|
| **A** | `skins/fonts/*` only | 6 | 94.8 KB |
| **B** | A + the fantasy skin's five non-duplicated declarations (now at `../../handoff/fantasy.css`) | 7 | 96.6 KB |
| **C** | B + `base.css`, `moods.css` (both at `../../handoff/`) and `composed/play.css` | 10 | 108.3 KB |
| **D** | C + `catalog/*` and `labels.ts` — the vocabulary tables, as reading material; will not compile | 15 | ~117 KB |
| **E** | everything, all 88 files | 88 | ~225 KB |

`composed/play.css` is named explicitly because it is the largest CSS file in the tree at 5.8 KB and
it encodes the play surface's actual geometry rather than just its palette. A subset drawn at "fonts
and skins only" drops it.

## What is lost if this directory is deleted

Stated honestly, because the irreversibility claim is usually overstated:

- **Nothing, today.** The source repo is still on disk at
  `/Users/pelao/REPOS/dreamchat/dreamchat-frontend/`, with its `src/`, lockfile and `index.html`. This
  is a copy.
- **Irrecoverable from text:** the five `.woff2` binaries, 94 KB. Every other file here is source or
  prose.
- **Lost regardless of the sibling checkout:** in-repo reachability. Anyone working only in
  `dream-weaver-visuals` loses the fonts, the 20 render tests, the skin-switching gallery and the five
  atmosphere/scrim/sheen/blur/status declarations. That loss becomes permanent whenever the archived
  repo is finally removed.

## The deletion trigger

**If the founder chooses the Lovable + shadcn direction:** lift subset A or B first, then delete
`docs/90_archive/design-system/` whole and record the answer in
`../../CONSOLIDATION-2026-08-26.md`.

Until that answer exists, this directory is held unwired. It is the only reason `docs/90_archive/` is
larger than a page, and it should not outlive the decision it is waiting on.
