# DreamChat Design System — Tokens-First, Multi-Skin Presentation Layer

**Date:** 2026-06-18
**Repo:** `zakkriel/dreamchat-frontend` (presentation only — never world truth)
**Stacks on:** `chunk-4-compendium-frontend` (NOT yet merged to `main`). This chunk refactors
the Chunk-4 components (`PageShell`, `KnowledgeGroups`, `Timeline`, `LoadError`, `NotFound`,
the pages) onto the design system, so it branches off chunk-4 and merges **after** it.
**Origin:** surfaced while attempting `/design-sync`, which found no design system to sync —
the app renders bare `system-ui` with ad-hoc inline `style={{}}` and no tokens. This chunk
builds the design system that was missing, structured to be `/design-sync`-ready later.

## Goal

A **web-based, tokens-first design system** living in-repo at `src/ds/`, with a **swappable
skin layer** so the same UI can re-theme per world/genre (fantasy, spy, noir, horror, …) at
runtime. v1 ships the **theming engine + a stable token contract + a focused component set +
two skins** (a polished **fantasy** flagship built from the repo's mockups, and a neutral
**base** fallback) + a `#/_ds` gallery route that proves a single switch re-skins everything.

## Hard constraints (safety/architecture load-bearing — cite, don't relitigate)

- **D-7 — presentation only.** The DS is pure presentation: no `fetch`, no world logic, no
  canon. It renders props. This *reinforces* the existing api-chokepoint guarantee — DS code
  contains no network calls (asserted; see Tests).
- **GA-3 — no hardcoded genre sections.** The DS exposes a skin *mechanism* and registry; it
  never hardcodes genre semantics or branches UI on genre. The **active skin is chosen by world
  projection data** (an app-side concern, later), not by DS or client genre logic. v1 ships the
  mechanism + a manual setter + a default; wiring skin selection to world data is out of scope.
- **D-8 — images arrive async.** `ImageSlot` renders a placeholder first and swaps on arrival;
  it never blocks layout or narration on image load.
- **B-5 — time as display labels.** `DayTimeChip` renders provided display labels
  ("Day 3 · Morning") only; it never computes or shows wall-clock.
- **No relationship UI (B-3/B-4).** The component set contains no relationship panel, meter,
  field, or label, and the DS provides no primitive that implies one.
- **Story language, not DB vocabulary (F-1/F-2).** Component names and any built-in copy use
  UI vocabulary (Actors, Locations, Artifacts, Timeline, Known World), never entity/canon/
  projection/inventory.

## Approach (decided)

In-repo `src/ds/` module, **CSS custom properties** for tokens, plain-CSS component styles,
React primitives, **no new runtime dependencies**. Rejected alternatives: a workspace package
(YAGNI — single consumer today; `src/ds/` is already extraction-ready), and a Tailwind preset
(adds a dep + build; runtime skin-swapping still needs CSS vars, so it buys little). All
delivery targets are web-rendered (responsive web now; installable later via Electron/Tauri/
Capacitor/PWA wrappers — all consume the same CSS + React DOM unchanged), so one web DS covers
them. True React Native is explicitly **not** a goal (would force a different, bigger split).

## 1. The semantic token contract (the stable API)

Components reference **only** these `--dc-*` variables, never raw values. The contract is the
API; skins supply values. Prefix `--dc-` = DreamChat (collision-safe).

| Group | Tokens |
|---|---|
| Color — surface | `--dc-bg`, `--dc-surface`, `--dc-surface-raised`, `--dc-overlay` |
| Color — line | `--dc-border`, `--dc-border-accent` |
| Color — text | `--dc-text`, `--dc-text-muted` |
| Color — accent | `--dc-accent`, `--dc-accent-strong`, `--dc-on-accent` |
| Color — status | `--dc-status-high`, `--dc-status-med`, `--dc-status-low` |
| Type — family | `--dc-font-display`, `--dc-font-body` |
| Type — scale | `--dc-text-xs … --dc-text-3xl`, `--dc-leading-tight/normal/relaxed`, `--dc-tracking-label` |
| Space | `--dc-space-1 … --dc-space-8` (4px base) |
| Radius | `--dc-radius-sm/md/lg/pill` |
| Depth/motion | `--dc-shadow-1`, `--dc-shadow-2`, `--dc-glow`, `--dc-ring`, `--dc-ease`, `--dc-dur` |

`--dc-dur` collapses to `0ms` under `prefers-reduced-motion: reduce` (in the base layer, so
every skin inherits it).

## 2. Skin system (the swap)

- `src/ds/skins/base.css` → `:root { --dc-*: … }` — neutral fallback, system fonts (zero asset
  cost), the default and the no-skin fallback GA-3 implies.
- `src/ds/skins/fantasy.css` → `[data-skin="fantasy"] { --dc-*: … }` — the extracted language:
  midnight-navy surfaces (`#0d1320` → `#1c2740`), warm-gold accent (`#c9a227`–`#e0b65c`),
  parchment text (`#e9e3d3`), muted slate (`#9aa0b2`), status red/amber, gold hairlines, soft
  glow/vignette, rounded ~10px. Display **Cinzel**, body **EB Garamond** (self-hosted woff2,
  system-serif fallback). *(Exact gold/serif are single-token swaps — easy to revise later.)*
- `src/ds/skins/index.ts` → registry `{ base, fantasy }`, `SkinName` type, `setSkin(name)`
  (sets `document.documentElement.dataset.skin`), `getSkin()`, `DEFAULT_SKIN = 'base'`. Invalid
  names fall back to base.
- Swap is instant — flipping `data-skin` re-resolves every `var(--dc-*)`. No rebuild, no React
  re-render required.

Fonts: `src/ds/skins/fonts/` holds woff2 + an `@font-face` block (`fonts.css`); `font-display:
swap`. Only fantasy pulls them; base stays on the system stack.

## 3. Component set (token-driven, presentation-only)

Built in tiers; v1 builds **only** what the existing pages + mockups use (YAGNI).

**Layout / frame**
- `AppFrame` — left `NavRail` + top `ChronicleBar` + content region (the mockups' chrome).
- `NavRail` — vertical icon+label rail; active item uses `--dc-accent`.
- `ChronicleBar` — breadcrumb, `DayTimeChip`, "Known World" action, search slot, avatar slot.
- `Stack` / `Inline` — spacing primitives driven by `--dc-space-*` (replace inline `style`).

**Content**
- `Heading` (display serif scale), `Text` (body, muted variant, italic flavor variant).
- `Panel` / `Card` — translucent surface, hairline border, optional title; the mockups' panels.
- `Button` (primary gold / quiet) + `IconButton`; `Chip`, `Badge` (status-colored), `Divider`.
- `Icon` — small inline-SVG set (nav glyphs, gem bullet, search, etc.); zero-dep, no icon lib.
- `DayTimeChip` (B-5), `PortraitFrame` (circular, active gold ring), `ImageSlot` (D-8
  placeholder→swap).

**Composed (refactors of existing Chunk-4 app code, onto tokens)**
- `KnowledgeList` ← `KnowledgeGroups` (gem-bulleted entries + epistemic meta; "last known…").
- `Timeline` ← existing `Timeline` (day nodes + rail; renders records in received order — no
  client sort, preserving the Chunk-4 guarantee).
- `MetaPanel` — the "Last known / Known possessions / Linked to" side panels.
- `EmptyState`, `LoadError` ← existing, `NotFound` ← existing (single identical 404 view kept
  byte-identical; the Chunk-4 indistinguishability test must still pass).
- `PageShell` re-expressed on `AppFrame`/`Panel`.

Pages stay in `src/pages/` and consume `src/ds`. Shared presentational components **migrate
into** `src/ds`; pages keep only data wiring.

## 4. File structure

```
src/ds/
  index.ts              # public entry: re-exports primitives, composed, skin API
  styles.css            # single @import root: fonts → base → fantasy → component css
  skins/
    base.css            # :root { --dc-* }  (+ reduced-motion override)
    fantasy.css         # [data-skin="fantasy"] { --dc-* }
    fonts/fonts.css     # @font-face; woff2 assets alongside
    index.ts            # registry, setSkin/getSkin, SkinName, DEFAULT_SKIN
  primitives/           # one folder-or-file per primitive: <Name>.tsx + <Name>.css + <Name>.test.tsx
  composed/             # KnowledgeList, Timeline, MetaPanel, EmptyState, LoadError, NotFound
  gallery/Gallery.tsx   # showcase of every primitive + skin switcher
```

`styles.css` is the **single `@import` closure** (fonts → skins → every component's CSS) — this
is what makes a future `/design-sync` faithful (rendered designs receive only that closure).
Component CSS uses `var(--dc-*)` exclusively; **only `skins/*.css` contains raw color values.**

## 5. Skin-swap proof — `#/_ds` gallery route

Add a `#/_ds` route to the existing zero-dep hash router (`src/router.tsx`) rendering
`<Gallery/>`: every primitive in representative states, plus a skin `<select>` calling
`setSkin`. Flipping it re-skins the whole gallery live — the v1 acceptance demo. No Storybook,
no new deps. Route is unlinked from app nav (dev/QA surface).

## 6. Tests (Vitest + Testing Library + jsdom; matches existing guard style)

1. **Primitive render/variants.** Each primitive renders, applies its `--dc-*`-backed classes,
   and honors variant props (e.g. `Button` primary vs quiet, `Badge` status colors).
2. **Focus ring / a11y basics.** Interactive primitives expose a visible `--dc-ring` focus
   state and correct roles.
3. **`ImageSlot` async (D-8).** Renders placeholder before load; swaps to the image on load;
   never throws on missing/late src.
4. **No-raw-color guard.** Scan `src/ds/**/*.css` *except* `skins/`; fail if any color literal
   (`#hex`, `rgb(`, named colors) appears outside `skins/` — the token contract stays honest.
   (Mirrors the existing `no-stray-fetch` guard.)
5. **No-fetch guard.** Assert `src/ds/**` contains no `fetch(` — DS is presentation-only (D-7),
   reinforcing the api chokepoint.
6. **Skin swap.** `setSkin('fantasy')` sets `data-skin="fantasy"` on `<html>`; an invalid name
   falls back to base; `getSkin()` reflects state.
7. **Refactor regressions.** `KnowledgeList`/`Timeline`/`NotFound` preserve Chunk-4 behavior:
   records render in received order; the 404 view stays identical (the Chunk-4
   indistinguishability and order tests must remain green).

## 7. Delivery

- Branch `design-system-skins` off `chunk-4-compendium-frontend`; one PR. Because it stacks on
  unmerged chunk-4, it targets chunk-4 (or `main` after chunk-4 lands) — **merges after chunk-4**.
- Mockups under `docs/20_design_ux/` are committed as design source (the fantasy skin derives
  from them).
- No new runtime deps. `build` stays `tsc && vite build` (Vite bundles woff2 + CSS as-is).
- `/design-sync` itself is **not run** in this chunk — the DS is merely built sync-ready.

## Non-goals (YAGNI)

- No third/fourth skin (noir/spy/horror) until a world needs one — v1 proves the engine with
  base + fantasy only.
- No wiring of skin selection to world projection data (app-side, later).
- No Storybook (a future enhancement that would upgrade `/design-sync` to screenshot-verified
  previews); the `#/_ds` gallery covers v1 needs.
- No workspace/monorepo package, no React Native / platform-agnostic component split.
- No new app surfaces or features — this chunk only restyles existing ones onto tokens.
- No CSS-in-JS, no utility-class framework, no icon-library dependency.
