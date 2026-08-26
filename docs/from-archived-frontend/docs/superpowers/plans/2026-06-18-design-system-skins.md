# DreamChat Design System (Skins) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-repo, tokens-first design system at `src/ds/` with a runtime-swappable skin layer (base + fantasy) and refactor the existing components onto it.

**Architecture:** A semantic CSS-custom-property token contract (`--dc-*`) is the stable API; each skin supplies values (`:root` = base, `[data-skin="fantasy"]` = fantasy). React primitives carry structure + `className`; all visual values come from tokens. A single `src/ds/styles.css` `@import`s the whole style closure (fonts → skins → every component CSS). A `#/_ds` gallery route proves one switch re-skins everything.

**Tech Stack:** React 18 + TypeScript, Vite 5, plain CSS custom properties (no CSS-in-JS, no utility framework), Vitest + Testing Library + jsdom. **No new runtime dependencies.**

## Global Constraints

(Every task implicitly includes these — values copied verbatim from the spec.)

- **No new runtime dependencies.** Fonts are self-hosted woff2 fetched into the repo; no npm font/icon/CSS libs.
- **Presentation only (D-7).** No `fetch`, no world logic, no canon anywhere under `src/ds/`. (Enforced by the existing `src/test/no-stray-fetch.test.ts`, which walks all of `src`.)
- **Token contract is the API.** Component CSS uses `var(--dc-*)` only. **Raw color literals (`#hex`, `rgb(`, `hsl(`) appear ONLY under `src/ds/skins/`.** Prefix is `--dc-` (DreamChat).
- **Default skin is `base`.** Invalid skin names fall back to base. Active-skin *selection* by world data is out of scope (mechanism + manual setter only — GA-3).
- **Time as display labels (B-5).** `DayTimeChip` renders provided label strings only; never computes time.
- **Images async (D-8).** `ImageSlot` shows a placeholder first, swaps on load, never blocks.
- **Preserve Chunk-4 behavior.** `Timeline` renders records in received order (no client sort); `NotFound` stays a single identical 404 view; existing tests stay green.
- **Story-language naming (F-1/F-2).** Component/Prop names use UI vocabulary (Actors, Locations, Artifacts, Timeline, Known World); never entity/canon/projection/inventory. No relationship UI (B-3/B-4).

**Branch:** `design-system-skins` (already created, stacked on `chunk-4-compendium-frontend`).

---

### Task 1: Token contract, base skin, style closure, and skin registry

**Files:**
- Create: `src/ds/skins/base.css`
- Create: `src/ds/styles.css`
- Create: `src/ds/skins/index.ts`
- Test: `src/ds/skins/skins.test.ts`
- Test: `src/test/ds-no-raw-color.test.ts`

**Interfaces:**
- Produces: `SKINS: readonly ["base","fantasy"]`, `type SkinName = "base"|"fantasy"`, `DEFAULT_SKIN: SkinName`, `isSkin(s: string): s is SkinName`, `setSkin(name: string): SkinName`, `getSkin(): SkinName`. Token names per the contract table below.

- [ ] **Step 1: Write the failing tests**

`src/ds/skins/skins.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { setSkin, getSkin, DEFAULT_SKIN, isSkin } from "./index";

describe("skin registry", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.skin;
  });

  it("defaults to base", () => {
    expect(DEFAULT_SKIN).toBe("base");
    expect(getSkin()).toBe("base");
  });

  it("setSkin applies a valid skin to <html> and returns it", () => {
    expect(setSkin("fantasy")).toBe("fantasy");
    expect(document.documentElement.dataset.skin).toBe("fantasy");
    expect(getSkin()).toBe("fantasy");
  });

  it("setSkin falls back to base for an unknown skin", () => {
    expect(setSkin("noir")).toBe("base");
    expect(getSkin()).toBe("base");
  });

  it("isSkin narrows known names only", () => {
    expect(isSkin("fantasy")).toBe(true);
    expect(isSkin("nope")).toBe(false);
  });
});
```

`src/test/ds-no-raw-color.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function walkCss(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walkCss(p);
    return p.endsWith(".css") ? [p] : [];
  });
}

// Components must theme through var(--dc-*). Raw colors live ONLY in skins/.
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe("token contract is honest", () => {
  it("no raw color literals in ds CSS outside skins/", () => {
    const offenders = walkCss("src/ds")
      .filter((f) => !f.includes(`${join("src", "ds", "skins")}`))
      .filter((f) => RAW_COLOR.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ds/skins/skins.test.ts src/test/ds-no-raw-color.test.ts`
Expected: FAIL — `Cannot find module './index'` (registry) and the color test errors on missing `src/ds` dir.

- [ ] **Step 3: Write the base token layer**

`src/ds/skins/base.css` (raw colors allowed here — this is `skins/`):
```css
/* Base skin — neutral fallback + the default. Carries the full --dc-* contract. */
:root {
  /* color — surface */
  --dc-bg: #f6f6f8;
  --dc-surface: #ffffff;
  --dc-surface-raised: #ffffff;
  --dc-overlay: rgba(20, 22, 28, 0.55);
  /* color — line */
  --dc-border: #d9dbe0;
  --dc-border-accent: #b8923a;
  /* color — text */
  --dc-text: #1a1c22;
  --dc-text-muted: #5c6270;
  /* color — accent */
  --dc-accent: #8a6d2f;
  --dc-accent-strong: #6f561f;
  --dc-on-accent: #ffffff;
  /* color — status */
  --dc-status-high: #b3261e;
  --dc-status-med: #9a6700;
  --dc-status-low: #5c6270;
  /* type — family */
  --dc-font-display: Georgia, "Times New Roman", serif;
  --dc-font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  /* type — scale */
  --dc-text-xs: 0.75rem;
  --dc-text-sm: 0.875rem;
  --dc-text-md: 1rem;
  --dc-text-lg: 1.25rem;
  --dc-text-xl: 1.5rem;
  --dc-text-2xl: 2rem;
  --dc-text-3xl: 2.75rem;
  --dc-leading-tight: 1.2;
  --dc-leading-normal: 1.5;
  --dc-leading-relaxed: 1.7;
  --dc-tracking-label: 0.08em;
  /* space (4px base) */
  --dc-space-1: 0.25rem;
  --dc-space-2: 0.5rem;
  --dc-space-3: 0.75rem;
  --dc-space-4: 1rem;
  --dc-space-5: 1.5rem;
  --dc-space-6: 2rem;
  --dc-space-7: 3rem;
  --dc-space-8: 4rem;
  /* radius */
  --dc-radius-sm: 4px;
  --dc-radius-md: 8px;
  --dc-radius-lg: 14px;
  --dc-radius-pill: 999px;
  /* depth / motion */
  --dc-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.08);
  --dc-shadow-2: 0 6px 24px rgba(0, 0, 0, 0.12);
  --dc-glow: none;
  --dc-ring: 0 0 0 3px rgba(138, 109, 47, 0.45);
  --dc-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dc-dur: 180ms;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dc-dur: 0ms; }
}
```

`src/ds/styles.css` (the single closure; fantasy + component imports are appended in later tasks):
```css
/* DreamChat Design System — single style closure.
   This file's transitive @import set is the entire DS look (the /design-sync root). */
@import "./skins/base.css";
```

- [ ] **Step 4: Write the skin registry**

`src/ds/skins/index.ts`:
```ts
export const SKINS = ["base", "fantasy"] as const;
export type SkinName = (typeof SKINS)[number];
export const DEFAULT_SKIN: SkinName = "base";

export function isSkin(s: string | undefined): s is SkinName {
  return s !== undefined && (SKINS as readonly string[]).includes(s);
}

/** Apply a skin to <html>. Unknown names fall back to base. Returns the applied skin. */
export function setSkin(name: string): SkinName {
  const skin: SkinName = isSkin(name) ? name : DEFAULT_SKIN;
  document.documentElement.dataset.skin = skin;
  return skin;
}

/** The currently applied skin (base when unset/unknown). */
export function getSkin(): SkinName {
  const cur = document.documentElement.dataset.skin;
  return isSkin(cur) ? cur : DEFAULT_SKIN;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/ds/skins/skins.test.ts src/test/ds-no-raw-color.test.ts`
Expected: PASS (4 + 1).

- [ ] **Step 6: Commit**

```bash
git add src/ds/skins/base.css src/ds/styles.css src/ds/skins/index.ts \
        src/ds/skins/skins.test.ts src/test/ds-no-raw-color.test.ts
git commit -m "feat(ds): token contract, base skin, style closure, skin registry"
```

---

### Task 2: Fantasy skin + self-hosted fonts

**Files:**
- Create: `src/ds/skins/fantasy.css`
- Create: `src/ds/skins/fonts/fonts.css`
- Create (binary, fetched): `src/ds/skins/fonts/*.woff2`
- Modify: `src/ds/styles.css` (prepend fonts, append fantasy)
- Test: `src/ds/skins/fantasy.test.ts`

**Interfaces:**
- Consumes: the `--dc-*` contract from Task 1.
- Produces: a `[data-skin="fantasy"]` override block; `"Cinzel"` / `"EB Garamond"` font faces.

- [ ] **Step 1: Fetch the woff2 files (self-host, no npm dep)**

Run:
```bash
mkdir -p src/ds/skins/fonts
base="https://cdn.jsdelivr.net/npm/@fontsource"
curl -fsSL "$base/cinzel/files/cinzel-latin-400-normal.woff2"        -o src/ds/skins/fonts/cinzel-400.woff2
curl -fsSL "$base/cinzel/files/cinzel-latin-700-normal.woff2"        -o src/ds/skins/fonts/cinzel-700.woff2
curl -fsSL "$base/eb-garamond/files/eb-garamond-latin-400-normal.woff2" -o src/ds/skins/fonts/eb-garamond-400.woff2
curl -fsSL "$base/eb-garamond/files/eb-garamond-latin-400-italic.woff2" -o src/ds/skins/fonts/eb-garamond-400-italic.woff2
curl -fsSL "$base/eb-garamond/files/eb-garamond-latin-700-normal.woff2" -o src/ds/skins/fonts/eb-garamond-700.woff2
ls -la src/ds/skins/fonts/
```
Expected: five non-empty `.woff2` files. (If offline, fantasy still works via the serif fallback in `fantasy.css`; rerun this step when online.)

- [ ] **Step 2: Write the failing test**

`src/ds/skins/fantasy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("fantasy skin", () => {
  const css = readFileSync("src/ds/skins/fantasy.css", "utf8");

  it("scopes overrides under [data-skin=\"fantasy\"]", () => {
    expect(css).toMatch(/\[data-skin="fantasy"\]\s*\{/);
  });

  it("overrides the key contract tokens", () => {
    for (const token of ["--dc-bg", "--dc-accent", "--dc-text", "--dc-font-display"]) {
      expect(css).toContain(token);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/ds/skins/fantasy.test.ts`
Expected: FAIL — `ENOENT ... fantasy.css`.

- [ ] **Step 4: Write the fantasy skin + font faces**

`src/ds/skins/fonts/fonts.css`:
```css
@font-face { font-family: "Cinzel"; font-weight: 400; font-display: swap;
  src: url("./cinzel-400.woff2") format("woff2"); }
@font-face { font-family: "Cinzel"; font-weight: 700; font-display: swap;
  src: url("./cinzel-700.woff2") format("woff2"); }
@font-face { font-family: "EB Garamond"; font-weight: 400; font-style: normal; font-display: swap;
  src: url("./eb-garamond-400.woff2") format("woff2"); }
@font-face { font-family: "EB Garamond"; font-weight: 400; font-style: italic; font-display: swap;
  src: url("./eb-garamond-400-italic.woff2") format("woff2"); }
@font-face { font-family: "EB Garamond"; font-weight: 700; font-style: normal; font-display: swap;
  src: url("./eb-garamond-700.woff2") format("woff2"); }
```

`src/ds/skins/fantasy.css`:
```css
/* Fantasy skin — midnight navy + warm gold "illuminated chronicle". Raw colors OK (skins/). */
[data-skin="fantasy"] {
  --dc-bg: #0d1320;
  --dc-surface: #161e30;
  --dc-surface-raised: #1c2740;
  --dc-overlay: rgba(8, 11, 20, 0.62);
  --dc-border: #2c3a55;
  --dc-border-accent: #6b5a2e;
  --dc-text: #e9e3d3;
  --dc-text-muted: #9aa0b2;
  --dc-accent: #c9a227;
  --dc-accent-strong: #e0b65c;
  --dc-on-accent: #1a1206;
  --dc-status-high: #c0533f;
  --dc-status-med: #cd9a3c;
  --dc-status-low: #9aa0b2;
  --dc-font-display: "Cinzel", Georgia, serif;
  --dc-font-body: "EB Garamond", Georgia, serif;
  --dc-shadow-2: 0 8px 30px rgba(0, 0, 0, 0.5);
  --dc-glow: 0 0 18px rgba(201, 162, 39, 0.25);
  --dc-ring: 0 0 0 3px rgba(201, 162, 39, 0.5);
}
```

- [ ] **Step 5: Wire into the style closure**

Edit `src/ds/styles.css` so fonts load first and fantasy follows base:
```css
/* DreamChat Design System — single style closure.
   This file's transitive @import set is the entire DS look (the /design-sync root). */
@import "./skins/fonts/fonts.css";
@import "./skins/base.css";
@import "./skins/fantasy.css";
```

- [ ] **Step 6: Run tests to verify pass + commit**

Run: `npx vitest run src/ds/skins/`
Expected: PASS.
```bash
git add src/ds/skins/fantasy.css src/ds/skins/fonts/ src/ds/styles.css src/ds/skins/fantasy.test.ts
git commit -m "feat(ds): fantasy skin + self-hosted Cinzel/EB Garamond"
```

---

### Task 3: Layout primitives — Stack & Inline

**Files:**
- Create: `src/ds/primitives/Stack.tsx`
- Create: `src/ds/primitives/Inline.tsx`
- Test: `src/ds/primitives/layout.test.tsx`

**Interfaces:**
- Produces: `type Space = 1|2|3|4|5|6|7|8`; `Stack({ gap?, as?, align?, style?, children })`, `Inline({ gap?, as?, align?, wrap?, style?, children })`. Both default `gap = 4`. Spacing maps to `var(--dc-space-N)`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/layout.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stack } from "./Stack";
import { Inline } from "./Inline";

describe("layout primitives", () => {
  it("Stack is a column with token gap", () => {
    const { getByTestId } = render(<Stack gap={5} data-testid="s">x</Stack>);
    const el = getByTestId("s");
    expect(el).toHaveStyle({ display: "flex", flexDirection: "column" });
    expect(el.style.gap).toBe("var(--dc-space-5)");
  });

  it("Inline is a row with token gap", () => {
    const { getByTestId } = render(<Inline gap={2} data-testid="i">x</Inline>);
    const el = getByTestId("i");
    expect(el).toHaveStyle({ display: "flex", flexDirection: "row" });
    expect(el.style.gap).toBe("var(--dc-space-2)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/layout.test.tsx`
Expected: FAIL — cannot find `./Stack`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Stack.tsx`:
```tsx
import type { CSSProperties, ElementType, ReactNode } from "react";

export type Space = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function Stack({
  gap = 4,
  as: As = "div",
  align,
  style,
  children,
  ...rest
}: {
  gap?: Space;
  as?: ElementType;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <As
      style={{ display: "flex", flexDirection: "column", gap: `var(--dc-space-${gap})`, alignItems: align, ...style }}
      {...rest}
    >
      {children}
    </As>
  );
}
```

`src/ds/primitives/Inline.tsx`:
```tsx
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { Space } from "./Stack";

export function Inline({
  gap = 4,
  as: As = "div",
  align = "center",
  wrap = false,
  style,
  children,
  ...rest
}: {
  gap?: Space;
  as?: ElementType;
  align?: CSSProperties["alignItems"];
  wrap?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <As
      style={{
        display: "flex",
        flexDirection: "row",
        gap: `var(--dc-space-${gap})`,
        alignItems: align,
        flexWrap: wrap ? "wrap" : "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ds/primitives/layout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ds/primitives/Stack.tsx src/ds/primitives/Inline.tsx src/ds/primitives/layout.test.tsx
git commit -m "feat(ds): Stack and Inline layout primitives"
```

---

### Task 4: Typography — Heading & Text

**Files:**
- Create: `src/ds/primitives/Heading.tsx`, `src/ds/primitives/Heading.css`
- Create: `src/ds/primitives/Text.tsx`, `src/ds/primitives/Text.css`
- Modify: `src/ds/styles.css` (append imports)
- Test: `src/ds/primitives/typography.test.tsx`

**Interfaces:**
- Produces: `Heading({ level?: 1|2|3, children, className?, ... })` (display font); `Text({ tone?: "default"|"muted", italic?, size?: "sm"|"md", as?, children, ... })` (body font). Class roots: `dc-h`, `dc-h--1..3`, `dc-text`, `dc-text--muted`, `dc-text--italic`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/typography.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Heading } from "./Heading";
import { Text } from "./Text";

describe("typography", () => {
  it("Heading renders the requested level with display class", () => {
    const { getByRole } = render(<Heading level={2}>Seren</Heading>);
    const h = getByRole("heading", { level: 2 });
    expect(h).toHaveClass("dc-h", "dc-h--2");
    expect(h).toHaveTextContent("Seren");
  });

  it("Text muted + italic apply modifier classes", () => {
    const { getByText } = render(<Text tone="muted" italic>last known…</Text>);
    expect(getByText("last known…")).toHaveClass("dc-text", "dc-text--muted", "dc-text--italic");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/typography.test.tsx`
Expected: FAIL — cannot find `./Heading`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Heading.css`:
```css
.dc-h { margin: 0; color: var(--dc-text); font-family: var(--dc-font-display); line-height: var(--dc-leading-tight); }
.dc-h--1 { font-size: var(--dc-text-3xl); font-weight: 700; }
.dc-h--2 { font-size: var(--dc-text-xl); font-weight: 700; }
.dc-h--3 { font-size: var(--dc-text-lg); font-weight: 700; }
```

`src/ds/primitives/Heading.tsx`:
```tsx
import type { ReactNode } from "react";

export function Heading({
  level = 1,
  className = "",
  children,
  ...rest
}: { level?: 1 | 2 | 3; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const Tag = (`h${level}`) as "h1" | "h2" | "h3";
  return (
    <Tag className={`dc-h dc-h--${level} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
```

`src/ds/primitives/Text.css`:
```css
.dc-text { margin: 0; color: var(--dc-text); font-family: var(--dc-font-body);
  font-size: var(--dc-text-md); line-height: var(--dc-leading-normal); }
.dc-text--sm { font-size: var(--dc-text-sm); }
.dc-text--muted { color: var(--dc-text-muted); }
.dc-text--italic { font-style: italic; }
```

`src/ds/primitives/Text.tsx`:
```tsx
import type { ElementType, ReactNode } from "react";

export function Text({
  tone = "default",
  italic = false,
  size = "md",
  as: As = "p",
  className = "",
  children,
  ...rest
}: {
  tone?: "default" | "muted";
  italic?: boolean;
  size?: "sm" | "md";
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const cls = [
    "dc-text",
    size === "sm" && "dc-text--sm",
    tone === "muted" && "dc-text--muted",
    italic && "dc-text--italic",
    className,
  ].filter(Boolean).join(" ");
  return <As className={cls} {...rest}>{children}</As>;
}
```

- [ ] **Step 4: Append CSS imports to the closure**

Add to the end of `src/ds/styles.css`:
```css
@import "./primitives/Heading.css";
@import "./primitives/Text.css";
```

- [ ] **Step 5: Run tests + guard, then commit**

Run: `npx vitest run src/ds/primitives/typography.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS (2 + guard still green).
```bash
git add src/ds/primitives/Heading.tsx src/ds/primitives/Heading.css \
        src/ds/primitives/Text.tsx src/ds/primitives/Text.css \
        src/ds/primitives/typography.test.tsx src/ds/styles.css
git commit -m "feat(ds): Heading and Text typography primitives"
```

---

### Task 5: Surfaces — Panel, Card, Divider

**Files:**
- Create: `src/ds/primitives/Panel.tsx`, `src/ds/primitives/Panel.css`
- Create: `src/ds/primitives/Divider.tsx`, `src/ds/primitives/Divider.css`
- Modify: `src/ds/styles.css`
- Test: `src/ds/primitives/surface.test.tsx`

**Interfaces:**
- Produces: `Panel({ title?, raised?, as?, children, ... })` (renders an optional `dc-panel__title` heading-style label then content); `Card` = `Panel` alias re-exported from `Panel.tsx`; `Divider({ }: {})`. Class roots: `dc-panel`, `dc-panel--raised`, `dc-panel__title`, `dc-divider`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/surface.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Panel, Card } from "./Panel";
import { Divider } from "./Divider";

describe("surfaces", () => {
  it("Panel renders its title and children", () => {
    const { getByText } = render(<Panel title="Collected knowledge">body</Panel>);
    expect(getByText("Collected knowledge")).toHaveClass("dc-panel__title");
    expect(getByText("body")).toBeInTheDocument();
  });

  it("Card is a Panel", () => {
    expect(Card).toBe(Panel);
  });

  it("Divider renders a separator", () => {
    const { getByRole } = render(<Divider />);
    expect(getByRole("separator")).toHaveClass("dc-divider");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/surface.test.tsx`
Expected: FAIL — cannot find `./Panel`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Panel.css`:
```css
.dc-panel { background: var(--dc-surface); border: 1px solid var(--dc-border);
  border-radius: var(--dc-radius-lg); padding: var(--dc-space-5); box-shadow: var(--dc-shadow-1); }
.dc-panel--raised { background: var(--dc-surface-raised); box-shadow: var(--dc-shadow-2); }
.dc-panel__title { margin: 0 0 var(--dc-space-3); color: var(--dc-text-muted);
  font-family: var(--dc-font-body); font-size: var(--dc-text-xs); font-weight: 700;
  letter-spacing: var(--dc-tracking-label); text-transform: uppercase; }
```

`src/ds/primitives/Panel.tsx`:
```tsx
import type { ElementType, ReactNode } from "react";

export function Panel({
  title,
  raised = false,
  as: As = "section",
  className = "",
  children,
  ...rest
}: {
  title?: ReactNode;
  raised?: boolean;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const cls = ["dc-panel", raised && "dc-panel--raised", className].filter(Boolean).join(" ");
  return (
    <As className={cls} {...rest}>
      {title != null && <div className="dc-panel__title">{title}</div>}
      {children}
    </As>
  );
}

/** Card is a Panel — same surface, named for content blocks. */
export const Card = Panel;
```

`src/ds/primitives/Divider.css`:
```css
.dc-divider { height: 1px; border: 0; margin: var(--dc-space-4) 0;
  background: var(--dc-border); }
```

`src/ds/primitives/Divider.tsx`:
```tsx
export function Divider({ className = "", ...rest }: { className?: string } & Record<string, unknown>) {
  return <hr className={`dc-divider ${className}`.trim()} {...rest} />;
}
```

- [ ] **Step 4: Append imports**

Add to `src/ds/styles.css`:
```css
@import "./primitives/Panel.css";
@import "./primitives/Divider.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/primitives/surface.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/primitives/Panel.tsx src/ds/primitives/Panel.css \
        src/ds/primitives/Divider.tsx src/ds/primitives/Divider.css \
        src/ds/primitives/surface.test.tsx src/ds/styles.css
git commit -m "feat(ds): Panel/Card surface + Divider"
```

---

### Task 6: Actions — Button & IconButton

**Files:**
- Create: `src/ds/primitives/Button.tsx`, `src/ds/primitives/Button.css`
- Create: `src/ds/primitives/IconButton.tsx`
- Modify: `src/ds/styles.css`
- Test: `src/ds/primitives/button.test.tsx`

**Interfaces:**
- Produces: `Button({ variant?: "primary"|"quiet", type?, children, ... })`; `IconButton({ label: string, children, ... })` (icon-only, `aria-label` required). Class roots: `dc-btn`, `dc-btn--primary`, `dc-btn--quiet`, `dc-iconbtn`. Both expose `var(--dc-ring)` focus.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/button.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("actions", () => {
  it("Button defaults to primary and fires onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = render(<Button onClick={onClick}>Continue</Button>);
    const btn = getByRole("button", { name: "Continue" });
    expect(btn).toHaveClass("dc-btn", "dc-btn--primary");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Button quiet variant", () => {
    const { getByRole } = render(<Button variant="quiet">Report</Button>);
    expect(getByRole("button")).toHaveClass("dc-btn--quiet");
  });

  it("IconButton requires an accessible label", () => {
    const { getByRole } = render(<IconButton label="Search">{"⌕"}</IconButton>);
    expect(getByRole("button", { name: "Search" })).toHaveClass("dc-iconbtn");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/button.test.tsx`
Expected: FAIL — cannot find `./Button`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Button.css`:
```css
.dc-btn { display: inline-flex; align-items: center; gap: var(--dc-space-2);
  font-family: var(--dc-font-body); font-size: var(--dc-text-sm); font-weight: 700;
  padding: var(--dc-space-2) var(--dc-space-4); border-radius: var(--dc-radius-md);
  border: 1px solid transparent; cursor: pointer;
  transition: background var(--dc-dur) var(--dc-ease), box-shadow var(--dc-dur) var(--dc-ease); }
.dc-btn:focus-visible { outline: none; box-shadow: var(--dc-ring); }
.dc-btn--primary { background: var(--dc-accent); color: var(--dc-on-accent); box-shadow: var(--dc-glow); }
.dc-btn--primary:hover { background: var(--dc-accent-strong); }
.dc-btn--quiet { background: transparent; color: var(--dc-text); border-color: var(--dc-border); }
.dc-btn--quiet:hover { border-color: var(--dc-border-accent); }
.dc-iconbtn { display: inline-grid; place-items: center; width: 2.25rem; height: 2.25rem;
  border-radius: var(--dc-radius-md); border: 1px solid transparent; background: transparent;
  color: var(--dc-text-muted); cursor: pointer; }
.dc-iconbtn:hover { color: var(--dc-accent-strong); }
.dc-iconbtn:focus-visible { outline: none; box-shadow: var(--dc-ring); }
```

`src/ds/primitives/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}: { variant?: "primary" | "quiet" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`dc-btn dc-btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
```

`src/ds/primitives/IconButton.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

export function IconButton({
  label,
  type = "button",
  className = "",
  children,
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} aria-label={label} className={`dc-iconbtn ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Append imports**

Add to `src/ds/styles.css`:
```css
@import "./primitives/Button.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/primitives/button.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/primitives/Button.tsx src/ds/primitives/Button.css \
        src/ds/primitives/IconButton.tsx src/ds/primitives/button.test.tsx src/ds/styles.css
git commit -m "feat(ds): Button + IconButton with token focus ring"
```

---

### Task 7: Chip & Badge

**Files:**
- Create: `src/ds/primitives/Chip.tsx`, `src/ds/primitives/Chip.css`
- Create: `src/ds/primitives/Badge.tsx`, `src/ds/primitives/Badge.css`
- Modify: `src/ds/styles.css`
- Test: `src/ds/primitives/chip-badge.test.tsx`

**Interfaces:**
- Produces: `Chip({ icon?, as?, href?, children, ... })` (pill; renders `<a>` when `href` given, else `<span>`); `Badge({ status?: "high"|"med"|"low", children, ... })`. Class roots: `dc-chip`, `dc-badge`, `dc-badge--high|med|low`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/chip-badge.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Chip } from "./Chip";
import { Badge } from "./Badge";

describe("chip + badge", () => {
  it("Chip with href renders a link", () => {
    const { getByRole } = render(<Chip href="#/locations/x">Dawnfall Market</Chip>);
    const a = getByRole("link", { name: /Dawnfall Market/ });
    expect(a).toHaveClass("dc-chip");
    expect(a).toHaveAttribute("href", "#/locations/x");
  });

  it("Chip without href renders a span", () => {
    const { getByText } = render(<Chip>Silver coin pouch</Chip>);
    expect(getByText("Silver coin pouch").tagName).toBe("SPAN");
  });

  it("Badge applies status modifier", () => {
    const { getByText } = render(<Badge status="high">High</Badge>);
    expect(getByText("High")).toHaveClass("dc-badge", "dc-badge--high");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/chip-badge.test.tsx`
Expected: FAIL — cannot find `./Chip`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Chip.css`:
```css
.dc-chip { display: inline-flex; align-items: center; gap: var(--dc-space-1);
  padding: var(--dc-space-1) var(--dc-space-3); border-radius: var(--dc-radius-pill);
  border: 1px solid var(--dc-border); background: var(--dc-surface-raised);
  color: var(--dc-text); font-family: var(--dc-font-body); font-size: var(--dc-text-xs);
  text-decoration: none; }
a.dc-chip:hover { border-color: var(--dc-border-accent); color: var(--dc-accent-strong); }
.dc-chip__icon { display: inline-grid; place-items: center; color: var(--dc-accent); }
```

`src/ds/primitives/Chip.tsx`:
```tsx
import type { ReactNode } from "react";

export function Chip({
  icon,
  href,
  className = "",
  children,
  ...rest
}: { icon?: ReactNode; href?: string; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const cls = `dc-chip ${className}`.trim();
  const inner = (
    <>
      {icon != null && <span className="dc-chip__icon">{icon}</span>}
      {children}
    </>
  );
  return href != null
    ? <a className={cls} href={href} {...rest}>{inner}</a>
    : <span className={cls} {...rest}>{inner}</span>;
}
```

`src/ds/primitives/Badge.css`:
```css
.dc-badge { display: inline-block; padding: 0 var(--dc-space-2); border-radius: var(--dc-radius-sm);
  font-family: var(--dc-font-body); font-size: var(--dc-text-xs); font-weight: 700;
  letter-spacing: var(--dc-tracking-label); text-transform: uppercase; color: var(--dc-on-accent); }
.dc-badge--high { background: var(--dc-status-high); }
.dc-badge--med { background: var(--dc-status-med); }
.dc-badge--low { background: var(--dc-status-low); }
```

`src/ds/primitives/Badge.tsx`:
```tsx
import type { ReactNode } from "react";

export function Badge({
  status = "low",
  className = "",
  children,
  ...rest
}: { status?: "high" | "med" | "low"; className?: string; children?: ReactNode } & Record<string, unknown>) {
  return (
    <span className={`dc-badge dc-badge--${status} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Append imports**

Add to `src/ds/styles.css`:
```css
@import "./primitives/Chip.css";
@import "./primitives/Badge.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/primitives/chip-badge.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/primitives/Chip.tsx src/ds/primitives/Chip.css \
        src/ds/primitives/Badge.tsx src/ds/primitives/Badge.css \
        src/ds/primitives/chip-badge.test.tsx src/ds/styles.css
git commit -m "feat(ds): Chip + Badge"
```

---

### Task 8: Icon (inline-SVG set)

**Files:**
- Create: `src/ds/primitives/Icon.tsx`
- Test: `src/ds/primitives/Icon.test.tsx`

**Interfaces:**
- Produces: `type IconName = "timeline"|"actor"|"location"|"artifact"|"known-world"|"search"|"gem"|"warn"`; `Icon({ name: IconName, size?, label?, ... })`. Renders an `<svg>` with `currentColor` strokes (so color comes from the consumer's `color` token). `label` sets `role="img"`/`aria-label`; absent ⇒ `aria-hidden`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/Icon.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders an svg using currentColor", () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("labelled icon is an accessible image", () => {
    const { getByRole } = render(<Icon name="gem" label="Known" />);
    expect(getByRole("img", { name: "Known" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/Icon.test.tsx`
Expected: FAIL — cannot find `./Icon`.

- [ ] **Step 3: Implement**

`src/ds/primitives/Icon.tsx`:
```tsx
const PATHS = {
  timeline: <path d="M4 12h16M4 6h10M4 18h7" />,
  actor: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  location: <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  artifact: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M12 3v18" /></>,
  "known-world": <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
  gem: <path d="M6 4h12l3 5-9 11L3 9l3-5Z" />,
  warn: <><path d="M12 3l10 18H2L12 3Z" /><path d="M12 10v5M12 18h.01" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  label,
  ...rest
}: { name: IconName; size?: number; label?: string } & Record<string, unknown>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ds/primitives/Icon.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ds/primitives/Icon.tsx src/ds/primitives/Icon.test.tsx
git commit -m "feat(ds): inline-SVG Icon set (currentColor)"
```

---

### Task 9: Media atoms — DayTimeChip, PortraitFrame, ImageSlot

**Files:**
- Create: `src/ds/primitives/DayTimeChip.tsx`
- Create: `src/ds/primitives/PortraitFrame.tsx`, `src/ds/primitives/PortraitFrame.css`
- Create: `src/ds/primitives/ImageSlot.tsx`, `src/ds/primitives/ImageSlot.css`
- Modify: `src/ds/styles.css`
- Test: `src/ds/primitives/media.test.tsx`

**Interfaces:**
- Produces: `DayTimeChip({ label: string })` (B-5: renders the given label only, via `Chip` with a timeline icon); `PortraitFrame({ src?, alt, active?, size? })`; `ImageSlot({ src?, alt, ratio? })` — placeholder until the image loads, swaps on `load` (D-8). Class roots: `dc-portrait`, `dc-portrait--active`, `dc-imageslot`, `dc-imageslot__img`, `dc-imageslot--loaded`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/media.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DayTimeChip } from "./DayTimeChip";
import { PortraitFrame } from "./PortraitFrame";
import { ImageSlot } from "./ImageSlot";

describe("media atoms", () => {
  it("DayTimeChip renders exactly the provided label", () => {
    const { getByText } = render(<DayTimeChip label="Day 3 · Morning" />);
    expect(getByText("Day 3 · Morning")).toBeInTheDocument();
  });

  it("PortraitFrame marks the active portrait", () => {
    const { getByTestId } = render(
      <PortraitFrame src="/s.png" alt="Seren" active data-testid="p" />,
    );
    expect(getByTestId("p")).toHaveClass("dc-portrait--active");
  });

  it("ImageSlot shows placeholder first, then swaps on load (D-8)", () => {
    const { container, getByAltText } = render(<ImageSlot src="/art.png" alt="Scene" />);
    const wrap = container.querySelector(".dc-imageslot")!;
    expect(wrap).not.toHaveClass("dc-imageslot--loaded"); // placeholder state
    fireEvent.load(getByAltText("Scene"));
    expect(wrap).toHaveClass("dc-imageslot--loaded");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/media.test.tsx`
Expected: FAIL — cannot find `./DayTimeChip`.

- [ ] **Step 3: Implement**

`src/ds/primitives/DayTimeChip.tsx`:
```tsx
import { Chip } from "./Chip";
import { Icon } from "./Icon";

/** B-5: renders the provided display label only — never computes time. */
export function DayTimeChip({ label }: { label: string }) {
  return <Chip icon={<Icon name="timeline" size={14} />}>{label}</Chip>;
}
```

`src/ds/primitives/PortraitFrame.css`:
```css
.dc-portrait { display: inline-block; border-radius: var(--dc-radius-pill); overflow: hidden;
  border: 2px solid var(--dc-border); background: var(--dc-surface-raised); }
.dc-portrait--active { border-color: var(--dc-accent); box-shadow: var(--dc-glow); }
.dc-portrait__img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dc-portrait__empty { width: 100%; height: 100%; }
```

`src/ds/primitives/PortraitFrame.tsx`:
```tsx
export function PortraitFrame({
  src,
  alt,
  active = false,
  size = 64,
  className = "",
  ...rest
}: { src?: string; alt: string; active?: boolean; size?: number; className?: string } & Record<string, unknown>) {
  const cls = ["dc-portrait", active && "dc-portrait--active", className].filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ width: size, height: size }} {...rest}>
      {src
        ? <img className="dc-portrait__img" src={src} alt={alt} />
        : <span className="dc-portrait__empty" role="img" aria-label={alt} />}
    </span>
  );
}
```

`src/ds/primitives/ImageSlot.css`:
```css
.dc-imageslot { position: relative; overflow: hidden; border-radius: var(--dc-radius-md);
  background: var(--dc-surface-raised); border: 1px solid var(--dc-border); }
.dc-imageslot__img { display: block; width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity var(--dc-dur) var(--dc-ease); }
.dc-imageslot--loaded .dc-imageslot__img { opacity: 1; }
.dc-imageslot__placeholder { position: absolute; inset: 0;
  background: linear-gradient(110deg, var(--dc-surface) 30%, var(--dc-surface-raised) 50%, var(--dc-surface) 70%); }
.dc-imageslot--loaded .dc-imageslot__placeholder { display: none; }
```

`src/ds/primitives/ImageSlot.tsx`:
```tsx
import { useState } from "react";

/** D-8: placeholder first, swap on load. Never blocks layout on image arrival. */
export function ImageSlot({
  src,
  alt,
  ratio = "16 / 9",
  className = "",
  ...rest
}: { src?: string; alt: string; ratio?: string; className?: string } & Record<string, unknown>) {
  const [loaded, setLoaded] = useState(false);
  const cls = ["dc-imageslot", loaded && "dc-imageslot--loaded", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ aspectRatio: ratio }} {...rest}>
      <div className="dc-imageslot__placeholder" />
      {src && (
        <img className="dc-imageslot__img" src={src} alt={alt} onLoad={() => setLoaded(true)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Append imports**

Add to `src/ds/styles.css`:
```css
@import "./primitives/PortraitFrame.css";
@import "./primitives/ImageSlot.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/primitives/media.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/primitives/DayTimeChip.tsx \
        src/ds/primitives/PortraitFrame.tsx src/ds/primitives/PortraitFrame.css \
        src/ds/primitives/ImageSlot.tsx src/ds/primitives/ImageSlot.css \
        src/ds/primitives/media.test.tsx src/ds/styles.css
git commit -m "feat(ds): DayTimeChip (B-5), PortraitFrame, ImageSlot (D-8)"
```

---

### Task 10: Frame — AppFrame, NavRail, ChronicleBar

**Files:**
- Create: `src/ds/primitives/NavRail.tsx`, `src/ds/primitives/NavRail.css`
- Create: `src/ds/primitives/ChronicleBar.tsx`, `src/ds/primitives/ChronicleBar.css`
- Create: `src/ds/primitives/AppFrame.tsx`, `src/ds/primitives/AppFrame.css`
- Modify: `src/ds/styles.css`
- Test: `src/ds/primitives/frame.test.tsx`

**Interfaces:**
- Produces:
  - `type NavItem = { key: string; label: string; icon: IconName; href: string }`
  - `NavRail({ items: NavItem[], activeKey?: string })`
  - `ChronicleBar({ breadcrumb?: ReactNode, dayTime?: string, actions?: ReactNode })`
  - `AppFrame({ nav: ReactNode, bar?: ReactNode, children })` → `<div class="dc-appframe">` with `nav`, `bar`, and a `<main class="dc-appframe__content">`.
  Class roots: `dc-navrail`, `dc-navrail__item`, `dc-navrail__item--active`, `dc-chrome`, `dc-appframe`, `dc-appframe__content`.

- [ ] **Step 1: Write the failing test**

`src/ds/primitives/frame.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NavRail } from "./NavRail";
import { ChronicleBar } from "./ChronicleBar";
import { AppFrame } from "./AppFrame";

const items = [
  { key: "timeline", label: "Timeline", icon: "timeline" as const, href: "#/timeline" },
  { key: "actors", label: "Actors", icon: "actor" as const, href: "#/actors" },
];

describe("frame", () => {
  it("NavRail marks the active item", () => {
    const { getByRole } = render(<NavRail items={items} activeKey="actors" />);
    const link = getByRole("link", { name: /Actors/ });
    expect(link).toHaveClass("dc-navrail__item--active");
  });

  it("ChronicleBar shows breadcrumb + day/time", () => {
    const { getByText } = render(
      <ChronicleBar breadcrumb={<span>Compendium</span>} dayTime="Day 3 · Morning" />,
    );
    expect(getByText("Compendium")).toBeInTheDocument();
    expect(getByText("Day 3 · Morning")).toBeInTheDocument();
  });

  it("AppFrame puts children in a main content region", () => {
    const { getByRole } = render(
      <AppFrame nav={<NavRail items={items} />} bar={<ChronicleBar />}>
        <p>page</p>
      </AppFrame>,
    );
    expect(getByRole("main")).toHaveTextContent("page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/primitives/frame.test.tsx`
Expected: FAIL — cannot find `./NavRail`.

- [ ] **Step 3: Implement**

`src/ds/primitives/NavRail.css`:
```css
.dc-navrail { display: flex; flex-direction: column; gap: var(--dc-space-2);
  padding: var(--dc-space-4) var(--dc-space-2); background: var(--dc-surface);
  border-right: 1px solid var(--dc-border); }
.dc-navrail__item { display: flex; flex-direction: column; align-items: center; gap: var(--dc-space-1);
  padding: var(--dc-space-2); border-radius: var(--dc-radius-md); text-decoration: none;
  color: var(--dc-text-muted); font-family: var(--dc-font-body); font-size: var(--dc-text-xs); }
.dc-navrail__item:hover { color: var(--dc-text); }
.dc-navrail__item--active { color: var(--dc-accent); }
.dc-navrail__item:focus-visible { outline: none; box-shadow: var(--dc-ring); }
```

`src/ds/primitives/NavRail.tsx`:
```tsx
import { Icon, type IconName } from "./Icon";

export type NavItem = { key: string; label: string; icon: IconName; href: string };

export function NavRail({ items, activeKey }: { items: NavItem[]; activeKey?: string }) {
  return (
    <nav className="dc-navrail" aria-label="Compendium">
      {items.map((it) => {
        const active = it.key === activeKey;
        return (
          <a
            key={it.key}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`dc-navrail__item${active ? " dc-navrail__item--active" : ""}`}
          >
            <Icon name={it.icon} />
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
```

`src/ds/primitives/ChronicleBar.css`:
```css
.dc-chrome { display: flex; align-items: center; gap: var(--dc-space-4);
  padding: var(--dc-space-3) var(--dc-space-5); background: var(--dc-surface);
  border-bottom: 1px solid var(--dc-border); }
.dc-chrome__crumb { color: var(--dc-text-muted); font-family: var(--dc-font-body);
  font-size: var(--dc-text-sm); }
.dc-chrome__spacer { flex: 1; }
.dc-chrome__actions { display: flex; align-items: center; gap: var(--dc-space-3); }
```

`src/ds/primitives/ChronicleBar.tsx`:
```tsx
import type { ReactNode } from "react";
import { DayTimeChip } from "./DayTimeChip";

export function ChronicleBar({
  breadcrumb,
  dayTime,
  actions,
}: { breadcrumb?: ReactNode; dayTime?: string; actions?: ReactNode }) {
  return (
    <header className="dc-chrome">
      {breadcrumb != null && <div className="dc-chrome__crumb">{breadcrumb}</div>}
      {dayTime != null && <DayTimeChip label={dayTime} />}
      <div className="dc-chrome__spacer" />
      {actions != null && <div className="dc-chrome__actions">{actions}</div>}
    </header>
  );
}
```

`src/ds/primitives/AppFrame.css`:
```css
.dc-appframe { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto 1fr;
  min-height: 100vh; background: var(--dc-bg); color: var(--dc-text); font-family: var(--dc-font-body); }
.dc-appframe__nav { grid-row: 1 / span 2; }
.dc-appframe__bar { grid-column: 2; }
.dc-appframe__content { grid-column: 2; padding: var(--dc-space-6); max-width: 1100px; }
@media (max-width: 720px) {
  .dc-appframe { grid-template-columns: 1fr; grid-template-rows: auto auto 1fr; }
  .dc-appframe__nav { grid-row: auto; }
  .dc-appframe__bar, .dc-appframe__content { grid-column: 1; }
}
```

`src/ds/primitives/AppFrame.tsx`:
```tsx
import type { ReactNode } from "react";

export function AppFrame({ nav, bar, children }: { nav: ReactNode; bar?: ReactNode; children?: ReactNode }) {
  return (
    <div className="dc-appframe">
      <div className="dc-appframe__nav">{nav}</div>
      {bar != null && <div className="dc-appframe__bar">{bar}</div>}
      <main className="dc-appframe__content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Append imports**

Add to `src/ds/styles.css`:
```css
@import "./primitives/NavRail.css";
@import "./primitives/ChronicleBar.css";
@import "./primitives/AppFrame.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/primitives/frame.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/primitives/NavRail.tsx src/ds/primitives/NavRail.css \
        src/ds/primitives/ChronicleBar.tsx src/ds/primitives/ChronicleBar.css \
        src/ds/primitives/AppFrame.tsx src/ds/primitives/AppFrame.css \
        src/ds/primitives/frame.test.tsx src/ds/styles.css
git commit -m "feat(ds): AppFrame + NavRail + ChronicleBar"
```

---

### Task 11: Composed — KnowledgeList, MetaPanel, EmptyState

**Files:**
- Create: `src/ds/composed/KnowledgeList.tsx`, `src/ds/composed/KnowledgeList.css`
- Create: `src/ds/composed/MetaPanel.tsx`
- Create: `src/ds/composed/EmptyState.tsx`
- Modify: `src/ds/styles.css`
- Test: `src/ds/composed/composed.test.tsx`

**Interfaces:**
- Consumes: `Panel`, `Heading`, `Text`, `Chip`, `Icon`, `Stack` from primitives.
- Produces:
  - `type KnowledgeItem = { perception_id: string; content: string; epistemic_type: string; display_label: string | null; decay: { stale?: boolean } & Record<string, unknown> }`
  - `type KnowledgeGroup = { group_key: string; group_label: string | null; items: KnowledgeItem[] }`
  - `KnowledgeList({ groups: KnowledgeGroup[]; emptyMessage: string })`
  - `MetaPanel({ title: string; children })`
  - `EmptyState({ children })`
  Class roots: `dc-knowledge`, `dc-knowledge__item`, `dc-knowledge__meta`.

- [ ] **Step 1: Write the failing test**

`src/ds/composed/composed.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KnowledgeList } from "./KnowledgeList";
import { MetaPanel } from "./MetaPanel";
import { EmptyState } from "./EmptyState";

const group = {
  group_key: "g1",
  group_label: "Dark Foxes connection",
  items: [
    { perception_id: "p1", content: "Seen at the market", epistemic_type: "Observation",
      display_label: "Day 3", decay: { stale: true } },
  ],
};

describe("composed", () => {
  it("KnowledgeList renders groups, items, and stale marker", () => {
    const { getByText } = render(<KnowledgeList groups={[group]} emptyMessage="Nothing known." />);
    expect(getByText("Dark Foxes connection")).toBeInTheDocument();
    expect(getByText("Seen at the market")).toBeInTheDocument();
    expect(getByText(/last known/i)).toBeInTheDocument();
  });

  it("KnowledgeList shows the empty message when no items", () => {
    const { getByText } = render(<KnowledgeList groups={[]} emptyMessage="Nothing known." />);
    expect(getByText("Nothing known.")).toBeInTheDocument();
  });

  it("MetaPanel + EmptyState render", () => {
    const { getByText } = render(<MetaPanel title="Last known"><EmptyState>—</EmptyState></MetaPanel>);
    expect(getByText("Last known")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/composed/composed.test.tsx`
Expected: FAIL — cannot find `./KnowledgeList`.

- [ ] **Step 3: Implement**

`src/ds/composed/KnowledgeList.css`:
```css
.dc-knowledge { list-style: none; margin: 0; padding: 0; }
.dc-knowledge__item { display: flex; gap: var(--dc-space-2); padding: var(--dc-space-2) 0;
  border-bottom: 1px solid var(--dc-border); }
.dc-knowledge__gem { color: var(--dc-accent); flex: none; margin-top: 2px; }
.dc-knowledge__meta { color: var(--dc-text-muted); font-size: var(--dc-text-xs); }
```

`src/ds/composed/KnowledgeList.tsx`:
```tsx
import { Panel } from "../primitives/Panel";
import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { Icon } from "../primitives/Icon";

export type KnowledgeItem = {
  perception_id: string;
  content: string;
  epistemic_type: string;
  display_label: string | null;
  decay: { stale?: boolean } & Record<string, unknown>;
};
export type KnowledgeGroup = {
  group_key: string;
  group_label: string | null;
  items: KnowledgeItem[];
};

export function KnowledgeList({ groups, emptyMessage }: { groups: KnowledgeGroup[]; emptyMessage: string }) {
  const hasKnowledge = groups.some((g) => (g.items ?? []).length > 0);
  return (
    <Panel title="Collected knowledge">
      {!hasKnowledge && <Text tone="muted" italic>{emptyMessage}</Text>}
      {groups.map((g) => (
        <div key={g.group_key}>
          {g.group_label && <Heading level={3}>{g.group_label}</Heading>}
          <ul className="dc-knowledge">
            {(g.items ?? []).map((it) => (
              <li key={it.perception_id} className="dc-knowledge__item">
                <span className="dc-knowledge__gem"><Icon name="gem" size={14} /></span>
                <div>
                  <Text>{it.content}</Text>
                  <Text as="small" tone="muted" size="sm" className="dc-knowledge__meta">
                    {it.epistemic_type}
                    {it.display_label ? ` · ${it.display_label}` : ""}
                    {it.decay && it.decay.stale ? " · last known…" : ""}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Panel>
  );
}
```

`src/ds/composed/MetaPanel.tsx`:
```tsx
import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";

export function MetaPanel({ title, children }: { title: string; children?: ReactNode }) {
  return <Panel title={title} raised>{children}</Panel>;
}
```

`src/ds/composed/EmptyState.tsx`:
```tsx
import type { ReactNode } from "react";
import { Text } from "../primitives/Text";

export function EmptyState({ children }: { children?: ReactNode }) {
  return <Text tone="muted" italic>{children}</Text>;
}
```

- [ ] **Step 4: Append import**

Add to `src/ds/styles.css`:
```css
@import "./composed/KnowledgeList.css";
```

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/ds/composed/composed.test.tsx src/test/ds-no-raw-color.test.ts`
Expected: PASS.
```bash
git add src/ds/composed/KnowledgeList.tsx src/ds/composed/KnowledgeList.css \
        src/ds/composed/MetaPanel.tsx src/ds/composed/EmptyState.tsx \
        src/ds/composed/composed.test.tsx src/ds/styles.css
git commit -m "feat(ds): KnowledgeList, MetaPanel, EmptyState"
```

---

### Task 12: Refactor existing components onto the DS

Migrate the Chunk-4 shared components into `src/ds`, preserving behavior. Update every importer.

**Files:**
- Create: `src/ds/composed/NotFound.tsx`, `src/ds/composed/LoadError.tsx`
- Create: `src/ds/composed/Timeline.tsx`, `src/ds/composed/Timeline.css`
- Create: `src/ds/composed/PageShell.tsx`
- Modify: `src/components/NotFound.tsx`, `src/components/LoadError.tsx`, `src/components/PageShell.tsx`, `src/components/KnowledgeGroups.tsx` → re-export from `src/ds` (keep paths stable so existing imports/tests keep working).
- Modify: `src/pages/Timeline.tsx` (use DS `Timeline`).
- Modify: `src/ds/styles.css` (append Timeline.css).
- Test: `src/ds/composed/refactor.test.tsx`

**Interfaces:**
- Consumes: `AppFrame`, `NavRail`, `ChronicleBar`, `Panel`, `Text`, `KnowledgeList` and its `KnowledgeGroup` type.
- Produces:
  - `NotFound()` — single identical 404 view (no props).
  - `LoadError()` — generic load failure (no props).
  - `PageShell({ title: string; subtitle?: string | null; nav?: ReactNode; bar?: ReactNode; children })`.
  - `Timeline({ records: TimelineRecord[] })` where `TimelineRecord = { perception_id: string; content: string; epistemic_type: string; display_label: string | null }` — renders in received order.

- [ ] **Step 1: Write the failing test**

`src/ds/composed/refactor.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotFound } from "./NotFound";
import { Timeline } from "./Timeline";

describe("refactored composed", () => {
  it("NotFound stays a single identical view (Chunk-4 indistinguishability)", () => {
    const a = render(<NotFound />).container.innerHTML;
    const b = render(<NotFound />).container.innerHTML;
    expect(a).toBe(b);
    expect(a).toMatch(/not found/i);
  });

  it("Timeline renders records in received order (no client sort)", () => {
    const records = [
      { perception_id: "r2", content: "Second", epistemic_type: "Event", display_label: "Day 2" },
      { perception_id: "r1", content: "First", epistemic_type: "Event", display_label: "Day 1" },
    ];
    const { getAllByText } = render(<Timeline records={records} />);
    const order = getAllByText(/First|Second/).map((n) => n.textContent);
    expect(order).toEqual(["Second", "First"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ds/composed/refactor.test.tsx`
Expected: FAIL — cannot find `./NotFound`.

- [ ] **Step 3: Implement the DS versions**

`src/ds/composed/NotFound.tsx`:
```tsx
import { Panel } from "../primitives/Panel";
import { Text } from "../primitives/Text";

/** Single not-found state. No props: withheld and nonexistent both arrive identically (404). */
export function NotFound() {
  return (
    <main className="dc-appframe__content">
      <Panel><Text>Not found.</Text></Panel>
    </main>
  );
}
```

`src/ds/composed/LoadError.tsx`:
```tsx
import { Panel } from "../primitives/Panel";
import { Text } from "../primitives/Text";

/** Generic load failure (non-404). Distinct from NotFound so an outage never reads as "not found". */
export function LoadError() {
  return (
    <main className="dc-appframe__content">
      <Panel><Text>Could not load this page.</Text></Panel>
    </main>
  );
}
```

`src/ds/composed/Timeline.css`:
```css
.dc-timeline { list-style: none; margin: 0; padding: 0; }
.dc-timeline__rec { padding: var(--dc-space-2) 0; border-bottom: 1px solid var(--dc-border); }
.dc-timeline__meta { color: var(--dc-text-muted); font-size: var(--dc-text-xs); }
```

`src/ds/composed/Timeline.tsx`:
```tsx
import { Text } from "../primitives/Text";

export type TimelineRecord = {
  perception_id: string;
  content: string;
  epistemic_type: string;
  display_label: string | null;
};

/** Renders records in received order — the API already orders by tick; no client sort (Chunk-4). */
export function Timeline({ records }: { records: TimelineRecord[] }) {
  return (
    <ul className="dc-timeline">
      {records.map((r) => (
        <li key={r.perception_id} className="dc-timeline__rec">
          <Text>{r.content}</Text>
          <Text as="small" tone="muted" size="sm" className="dc-timeline__meta">
            {r.epistemic_type}
            {r.display_label ? ` · ${r.display_label}` : ""}
          </Text>
        </li>
      ))}
    </ul>
  );
}
```

`src/ds/composed/PageShell.tsx`:
```tsx
import type { ReactNode } from "react";
import { AppFrame } from "../primitives/AppFrame";
import { NavRail, type NavItem } from "../primitives/NavRail";
import { ChronicleBar } from "../primitives/ChronicleBar";
import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";

const DEFAULT_NAV: NavItem[] = [
  { key: "timeline", label: "Timeline", icon: "timeline", href: "#/timeline" },
  { key: "actors", label: "Actors", icon: "actor", href: "#/actors" },
  { key: "locations", label: "Locations", icon: "location", href: "#/locations" },
  { key: "artifacts", label: "Artifacts", icon: "artifact", href: "#/artifacts" },
];

export function PageShell({
  title,
  subtitle,
  nav,
  bar,
  children,
}: {
  title: string;
  subtitle?: string | null;
  nav?: ReactNode;
  bar?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <AppFrame nav={nav ?? <NavRail items={DEFAULT_NAV} />} bar={bar ?? <ChronicleBar breadcrumb="Compendium" />}>
      <Heading level={1}>{title}</Heading>
      {subtitle && <Text tone="muted">{subtitle}</Text>}
      {children}
    </AppFrame>
  );
}
```

- [ ] **Step 4: Re-point the old paths at the DS (keep importers stable)**

Replace each file body with a re-export.

`src/components/NotFound.tsx`:
```tsx
export { NotFound } from "../ds/composed/NotFound";
```
`src/components/LoadError.tsx`:
```tsx
export { LoadError } from "../ds/composed/LoadError";
```
`src/components/PageShell.tsx`:
```tsx
export { PageShell } from "../ds/composed/PageShell";
```
`src/components/KnowledgeGroups.tsx`:
```tsx
import { KnowledgeList, type KnowledgeGroup } from "../ds/composed/KnowledgeList";

/** Back-compat shim: the old name/signature, now backed by the DS KnowledgeList. */
export function KnowledgeGroups({ groups, emptyMessage }: { groups: KnowledgeGroup[]; emptyMessage: string }) {
  return <KnowledgeList groups={groups} emptyMessage={emptyMessage} />;
}
```

Update `src/pages/Timeline.tsx` to render the DS Timeline (replace the inline `<ul>`):
```tsx
import { useEffect, useState } from "react";
import type { Timeline as TimelineT } from "../types/timeline";
import { fetchTimeline, NOT_FOUND, type Fetched } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";
import { Timeline as TimelineView } from "../ds/composed/Timeline";

export function Timeline({ world }: { world: string }) {
  const [data, setData] = useState<Fetched<TimelineT> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setData(null);
    setFailed(false);
    fetchTimeline(world)
      .then(setData)
      .catch(() => setFailed(true));
  }, [world]);

  if (failed) return <LoadError />;
  if (data === null) return <main>Loading…</main>;
  if (data === NOT_FOUND) return <NotFound />;

  return (
    <PageShell title="Timeline">
      <TimelineView records={data.records} />
    </PageShell>
  );
}
```

- [ ] **Step 5: Append import**

Add to `src/ds/styles.css`:
```css
@import "./composed/Timeline.css";
```

- [ ] **Step 6: Run the full suite (refactor must not break Chunk-4 tests)**

Run: `npm test`
Expected: PASS — including the existing `NotFound`, page, router, and `no-stray-fetch` tests.

- [ ] **Step 7: Commit**

```bash
git add src/ds/composed/ src/components/ src/pages/Timeline.tsx src/ds/styles.css \
        src/ds/composed/refactor.test.tsx
git commit -m "refactor: move shared components into src/ds, behavior preserved"
```

---

### Task 13: Public entry, gallery, `#/_ds` route, and global stylesheet wiring

**Files:**
- Create: `src/ds/index.ts`
- Create: `src/ds/gallery/Gallery.tsx`
- Modify: `src/router.tsx` (add `#/_ds` route)
- Modify: `src/main.tsx` (import the DS stylesheet once)
- Test: `src/ds/gallery/gallery.test.tsx`
- Test: `src/router.test.tsx` (extend — add `_ds` case)

**Interfaces:**
- Consumes: every primitive + composed export, and `setSkin`/`getSkin`/`SKINS`.
- Produces: `src/ds/index.ts` re-exporting the public API; `Gallery()` (renders a sample of every primitive + a skin `<select>` calling `setSkin`); router `Route` gains `{ surface: "ds" }`, `parseHash("#/_ds")` → `{ surface: "ds" }`.

- [ ] **Step 1: Write the failing tests**

`src/ds/gallery/gallery.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Gallery } from "./Gallery";

describe("Gallery", () => {
  beforeEach(() => { delete document.documentElement.dataset.skin; });

  it("renders a skin switcher that re-skins the document", () => {
    const { getByLabelText } = render(<Gallery />);
    const select = getByLabelText("Skin") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "fantasy" } });
    expect(document.documentElement.dataset.skin).toBe("fantasy");
  });
});
```

Add to `src/router.test.tsx` (append inside the existing `parseHash` describe, or add a new one):
```tsx
import { parseHash } from "./router";
import { describe, it, expect } from "vitest";

describe("parseHash _ds", () => {
  it("routes #/_ds to the design-system gallery", () => {
    expect(parseHash("#/_ds")).toEqual({ surface: "ds" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ds/gallery/gallery.test.tsx src/router.test.tsx`
Expected: FAIL — cannot find `./Gallery`; `parseHash` returns `{surface:"home"}` for `#/_ds`.

- [ ] **Step 3: Implement the public entry**

`src/ds/index.ts`:
```ts
// Skins
export { setSkin, getSkin, SKINS, DEFAULT_SKIN, type SkinName } from "./skins/index";
// Layout
export { Stack, type Space } from "./primitives/Stack";
export { Inline } from "./primitives/Inline";
// Typography
export { Heading } from "./primitives/Heading";
export { Text } from "./primitives/Text";
// Surfaces
export { Panel, Card } from "./primitives/Panel";
export { Divider } from "./primitives/Divider";
// Actions
export { Button } from "./primitives/Button";
export { IconButton } from "./primitives/IconButton";
// Tags
export { Chip } from "./primitives/Chip";
export { Badge } from "./primitives/Badge";
// Icon
export { Icon, type IconName } from "./primitives/Icon";
// Media
export { DayTimeChip } from "./primitives/DayTimeChip";
export { PortraitFrame } from "./primitives/PortraitFrame";
export { ImageSlot } from "./primitives/ImageSlot";
// Frame
export { AppFrame } from "./primitives/AppFrame";
export { NavRail, type NavItem } from "./primitives/NavRail";
export { ChronicleBar } from "./primitives/ChronicleBar";
// Composed
export { KnowledgeList, type KnowledgeGroup, type KnowledgeItem } from "./composed/KnowledgeList";
export { MetaPanel } from "./composed/MetaPanel";
export { EmptyState } from "./composed/EmptyState";
export { Timeline, type TimelineRecord } from "./composed/Timeline";
export { NotFound } from "./composed/NotFound";
export { LoadError } from "./composed/LoadError";
export { PageShell } from "./composed/PageShell";
```

- [ ] **Step 4: Implement the Gallery**

`src/ds/gallery/Gallery.tsx`:
```tsx
import { useState } from "react";
import {
  SKINS, setSkin, getSkin, type SkinName,
  Stack, Inline, Heading, Text, Panel, Divider, Button, IconButton,
  Chip, Badge, Icon, DayTimeChip, PortraitFrame, ImageSlot,
  AppFrame, NavRail, ChronicleBar, KnowledgeList, MetaPanel,
} from "../index";

const NAV = [
  { key: "timeline", label: "Timeline", icon: "timeline" as const, href: "#/_ds" },
  { key: "actors", label: "Actors", icon: "actor" as const, href: "#/_ds" },
];

const GROUP = [{
  group_key: "g", group_label: "Dark Foxes connection",
  items: [{ perception_id: "p", content: "Seen at the market", epistemic_type: "Observation",
    display_label: "Day 3", decay: { stale: true } }],
}];

export function Gallery() {
  const [skin, setSkinState] = useState<SkinName>(getSkin());
  return (
    <AppFrame
      nav={<NavRail items={NAV} activeKey="actors" />}
      bar={
        <ChronicleBar
          breadcrumb="Design System"
          dayTime="Day 3 · Morning"
          actions={
            <label>
              <span style={{ marginInlineEnd: "var(--dc-space-2)" }}>Skin</span>
              <select
                aria-label="Skin"
                value={skin}
                onChange={(e) => setSkinState(setSkin(e.target.value))}
              >
                {SKINS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          }
        />
      }
    >
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading level={1}>Seren</Heading>
          <Text tone="muted" italic>Master informer, as you currently know her.</Text>
        </Stack>
        <Inline gap={3} wrap>
          <Button>Continue</Button>
          <Button variant="quiet">Report issue</Button>
          <IconButton label="Search"><Icon name="search" /></IconButton>
          <Chip icon={<Icon name="location" size={14} />} href="#/_ds">Dawnfall Market</Chip>
          <Badge status="high">High</Badge>
          <Badge status="med">Medium</Badge>
          <DayTimeChip label="Day 3 · Morning" />
          <PortraitFrame alt="Seren" active />
        </Inline>
        <Divider />
        <Inline gap={4} align="start" wrap>
          <div style={{ flex: "1 1 320px" }}><KnowledgeList groups={GROUP} emptyMessage="Nothing known." /></div>
          <div style={{ flex: "1 1 240px" }}>
            <MetaPanel title="Last known"><Text tone="muted">Dawnfall Market · Day 3, Morning</Text></MetaPanel>
          </div>
          <div style={{ flex: "1 1 240px" }}><ImageSlot alt="Scene placeholder" /></div>
        </Inline>
        <Panel title="Collected knowledge"><Text>Panels, borders, and type all read from the active skin's tokens.</Text></Panel>
      </Stack>
    </AppFrame>
  );
}
```

- [ ] **Step 5: Wire the route and the stylesheet**

In `src/router.tsx`: extend the `Route` union, `parseHash`, and `render`.

Change the `Route` type to add the variant:
```tsx
export type Route =
  | { surface: "home" }
  | { surface: "index"; kind: Kind }
  | { surface: "page"; kind: Kind; id: string }
  | { surface: "timeline" }
  | { surface: "ds" };
```
Add this branch in `parseHash` (before the final `return { surface: "home" }`):
```tsx
  if (parts.length === 1 && parts[0] === "_ds") return { surface: "ds" };
```
Add the import at the top:
```tsx
import { Gallery } from "./ds/gallery/Gallery";
```
Add this case in `render`'s switch:
```tsx
    case "ds":
      return <Gallery />;
```

In `src/main.tsx`, import the DS style closure once (top of file, before `createRoot`):
```tsx
import "./ds/styles.css";
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run src/ds/gallery/gallery.test.tsx src/router.test.tsx && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 7: Full suite + commit**

Run: `npm test`
Expected: PASS (all suites).
```bash
git add src/ds/index.ts src/ds/gallery/Gallery.tsx src/ds/gallery/gallery.test.tsx \
        src/router.tsx src/router.test.tsx src/main.tsx
git commit -m "feat(ds): public entry, #/_ds skin gallery, global stylesheet wiring"
```

- [ ] **Step 8: Manual skin-swap proof (acceptance demo)**

Run: `npm run dev`, open `http://localhost:5173/#/_ds`, switch the Skin select between `base` and `fantasy`.
Expected: the whole gallery re-skins instantly (midnight-navy + gold for fantasy; neutral for base).

---

## Self-Review

**Spec coverage:**
- Token contract (§1) → Task 1. Skin system + swap (§2) → Tasks 1–2, proof in Task 13. Fonts → Task 2.
- Component set (§3): layout → T3; typography → T4; surfaces → T5; actions → T6; chip/badge → T7; icon → T8; media/B-5/D-8 → T9; frame → T10; composed → T11; refactors (Timeline order, identical NotFound) → T12.
- File structure (§4) incl. `styles.css` @import closure → built up across T1–T12, finalized T13; `index.ts` → T13.
- `#/_ds` gallery (§5) → T13. Tests (§6): no-raw-color → T1; no-fetch → existing test (noted, covers `src/ds`); primitive/variant/focus/async → T3–T11; skin swap → T1/T13; refactor regressions → T12.
- Delivery (§7): branch stacked on chunk-4 (header); no new runtime deps (fonts self-hosted, T2); `/design-sync` not run (out of scope). Non-goals respected: only base+fantasy, no Storybook, no world-data wiring, no monorepo, no RN.

**Placeholder scan:** none — every step carries real code/commands and expected output.

**Type consistency:** `KnowledgeGroup`/`KnowledgeItem` defined in T11, reused verbatim in T12 shim and T13 export. `NavItem`/`IconName` defined in T10/T8, reused in PageShell/Gallery. `TimelineRecord` defined in T12, exported in T13. `setSkin`/`getSkin`/`SKINS`/`SkinName`/`DEFAULT_SKIN`/`Space` names match across T1, T3, T13. `Route` extension in T13 matches the existing union in `src/router.tsx`.
