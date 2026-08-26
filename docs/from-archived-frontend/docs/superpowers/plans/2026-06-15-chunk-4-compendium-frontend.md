# Chunk-4 Frontend Leg — Compendium Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Compendium presentation FE — index lists, location/artifact pages, timeline — over the vendored backend contract, with tests proving the FE itself cannot leak.

**Architecture:** Vendor the 5 published schemas into `contracts/`, codegen TS types from them. A single `src/api.ts` builds every request URL through one `compendiumUrl()` chokepoint, forwards `?viewer=` verbatim, and maps 404 → a single `NOT_FOUND` sentinel (no withheld-vs-missing branch) / non-404 → a thrown error rendered as a generic load-error. A zero-dep hash router selects among 7 surfaces; components render exactly what the API returns in received order, with honest-null placeholders and all opaque arrays deferred.

**Tech Stack:** React 18 + TypeScript + Vite (existing). Vitest + @testing-library/react + jsdom (new, for TDD). `json-schema-to-typescript` (`json2ts`, existing) for codegen. Bash scripts + a minimal GitHub Actions workflow for drift gating.

**Spec:** `docs/superpowers/specs/2026-06-15-chunk-4-compendium-frontend-design.md`

**Conventions for every task:** strict TS is on (`noUnusedLocals`/`noUnusedParameters`) — no unused vars. Tests live under `src/**/*.test.tsx` and `src/test/` and are excluded from `tsc` build. Commit after each task.

---

## Task 1: Vendor the contract and codegen all five types

**Files:**
- Create: `contracts/actor_page.v1.schema.json`, `contracts/location_page.v1.schema.json`, `contracts/artifact_page.v1.schema.json`, `contracts/timeline.v1.schema.json`, `contracts/compendium_index.v1.schema.json`
- Create: `contracts/README.md`
- Modify: `package.json` (the `gen:types` script)
- Create/regen: `src/types/actor_page.ts`, `src/types/location_page.ts`, `src/types/artifact_page.ts`, `src/types/timeline.ts`, `src/types/compendium_index.ts`

- [ ] **Step 1: Copy the five schemas verbatim from backend main**

```bash
mkdir -p contracts
cp /Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/actor_page.v1.schema.json contracts/
cp /Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/location_page.v1.schema.json contracts/
cp /Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/artifact_page.v1.schema.json contracts/
cp /Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/timeline.v1.schema.json contracts/
cp /Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema/compendium_index.v1.schema.json contracts/
ls contracts/
```

Expected: the five `.json` files listed. If the sibling clone is unreadable, fetch each from
`https://raw.githubusercontent.com/zakkriel/dreamchat-world-backend/main/core/api/schema/<file>` instead.

- [ ] **Step 2: Write `contracts/README.md`**

```markdown
# Vendored API contract

These JSON Schemas are the **published** Compendium contract, vendored verbatim from
`dreamchat-world-backend` **main** at `core/api/schema/`. They are the source of truth for the
TypeScript types in `src/types/`.

- **Do not hand-edit** these files or the generated types. To update: re-copy from backend main,
  then run `npm run gen:types`.
- `npm run verify:types` (hermetic, CI) fails if `src/types/` drifts from these schemas.
- `npm run verify:contract` (needs backend) fails if these copies drift from backend main. Run it
  on every PR and on every re-vendor (see the PR checklist).
```

- [ ] **Step 3: Rewrite the `gen:types` script to generate all five types**

In `package.json`, replace the existing `gen:types` line with:

```json
    "gen:types": "json2ts -i contracts/actor_page.v1.schema.json -o src/types/actor_page.ts && json2ts -i contracts/location_page.v1.schema.json -o src/types/location_page.ts && json2ts -i contracts/artifact_page.v1.schema.json -o src/types/artifact_page.ts && json2ts -i contracts/timeline.v1.schema.json -o src/types/timeline.ts && json2ts -i contracts/compendium_index.v1.schema.json -o src/types/compendium_index.ts",
```

- [ ] **Step 4: Generate the types**

Run: `npm run gen:types`
Expected: no errors; `src/types/` now contains `actor_page.ts`, `location_page.ts`, `artifact_page.ts`, `timeline.ts`, `compendium_index.ts`.

- [ ] **Step 5: Verify the generated types compile and match the contract**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors). Spot-check that `src/types/location_page.ts` exports `LocationPage`, `artifact_page.ts` exports `ArtifactPage`, `timeline.ts` exports `Timeline`, `compendium_index.ts` exports `CompendiumIndex`.

- [ ] **Step 6: Commit**

```bash
git add contracts package.json src/types
git commit -m "feat: vendor Compendium contract and codegen all five types"
```

---

## Task 2: Add the test toolchain (Vitest + Testing Library + jsdom)

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `tsconfig.json` (exclude tests from the build)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest@^2.0.0 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.4.0 jsdom@^24.0.0
```

Expected: installs succeed; `node_modules/.bin/vitest` now exists.

- [ ] **Step 2: Add the `test` script to `package.json`**

In the `scripts` block add:

```json
    "test": "vitest run",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Exclude tests from the production `tsc` build**

In `tsconfig.json`, add a top-level `"exclude"` key (sibling of `"include"`):

```json
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]
```

- [ ] **Step 6: Add a smoke test to prove the toolchain runs**

Create `src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("toolchain", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the smoke test**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/test/smoke.test.ts tsconfig.json
git commit -m "test: add vitest + testing-library + jsdom toolchain"
```

---

## Task 3: API layer — single URL chokepoint, viewer passthrough, NOT_FOUND sentinel

This task implements the leak-proof boundary with TDD. Tests assert the network allowlist
(spec Test 4), `?viewer=` forwarding (spec Test 5), and the 404 → NOT_FOUND / 500 → throw split.

**Files:**
- Create: `src/test/fixtures.ts`
- Create: `src/api.test.ts`
- Modify: `src/api.ts` (full rewrite)

- [ ] **Step 1: Create shared test fixtures**

Create `src/test/fixtures.ts`:

```ts
import type { ActorPage } from "../types/actor_page";
import type { LocationPage } from "../types/location_page";
import type { ArtifactPage } from "../types/artifact_page";
import type { Timeline } from "../types/timeline";
import type { CompendiumIndex } from "../types/compendium_index";

export const WORLD = "11111111-1111-1111-1111-111111111111";
export const ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export const actorPage: ActorPage = {
  schema_version: "actor_page/1",
  world_id: WORLD,
  viewer_id: "00000000-0000-0000-0000-000000000001",
  actor: {
    id: ID,
    perceived_name: "Mara",
    perceived_role: "innkeeper",
    current_synthesis: "Keeps the tavern on the south road.",
    last_known_status: "Behind the bar, last seen at dusk.",
    known_artifacts: [],
    inline_links: [],
    collected_knowledge_groups: [
      {
        group_key: "sightings",
        group_label: "Sightings",
        items: [
          {
            perception_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            content: "Saw her pour ale for a hooded traveler.",
            epistemic_type: "observed",
            occurred_at_tick: 12,
            display_label: "Day 2, Evening",
            confidence: 0.9,
            decay: {},
            source: {},
          },
        ],
      },
    ],
  },
};

// Same shape, but the name is withheld (null) and there is NO canon name anywhere.
export const actorPageWithheld: ActorPage = {
  ...actorPage,
  actor: {
    ...actorPage.actor,
    perceived_name: null,
    perceived_role: null,
    current_synthesis: null,
    last_known_status: null,
    collected_knowledge_groups: [],
  },
};

export const locationPage: LocationPage = {
  schema_version: "location_page/1",
  world_id: WORLD,
  viewer_id: "00000000-0000-0000-0000-000000000001",
  location: {
    id: ID,
    perceived_name: "The Last Lantern",
    part_of: "Greywater",
    current_synthesis: "A tavern by the docks.",
    last_known_status: "Lights on, door open.",
    known_areas_inside: [],
    key_actors: [],
    inline_links: [],
    collected_knowledge_groups: [],
  },
};

export const artifactPage: ArtifactPage = {
  schema_version: "artifact_page/1",
  world_id: WORLD,
  viewer_id: "00000000-0000-0000-0000-000000000001",
  artifact: {
    id: ID,
    perceived_name: "Bone Key",
    perceived_type: "key",
    current_synthesis: "An old key of yellowed bone.",
    last_known_location: "On a hook behind the bar.",
    current_holder_owner_access: "Held by the innkeeper.",
    inline_links: [],
    collected_knowledge_groups: [],
  },
};

export const timeline: Timeline = {
  schema_version: "timeline/1",
  world_id: WORLD,
  viewer_id: "00000000-0000-0000-0000-000000000001",
  records: [
    {
      perception_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      content: "A bell rang in the harbor.",
      epistemic_type: "observed",
      occurred_at_tick: 5,
      display_label: "Day 1, Morning",
      confidence: 1,
      decay: {},
    },
    {
      perception_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      content: "Smoke rose over the hill.",
      epistemic_type: "observed",
      occurred_at_tick: 9,
      display_label: "Day 1, Evening",
      confidence: 0.8,
      decay: {},
    },
  ],
};

export function indexFixture(kind: CompendiumIndex["kind"]): CompendiumIndex {
  return {
    schema_version: "compendium_index/1",
    world_id: WORLD,
    viewer_id: "00000000-0000-0000-0000-000000000001",
    kind,
    entries: [
      { id: "11111111-1111-1111-1111-111111111101", perceived_name: "Mara" },
      { id: "11111111-1111-1111-1111-111111111102", perceived_name: null },
      { id: "11111111-1111-1111-1111-111111111103", perceived_name: "The Last Lantern" },
    ],
  };
}

/** Build a fetch stub that returns `body` as JSON with the given status. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: Write the failing API tests**

Create `src/api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchIndex, fetchPage, fetchTimeline, NOT_FOUND } from "./api";
import { WORLD, ID, actorPage, indexFixture, timeline, jsonResponse } from "./test/fixtures";

const ALLOWED =
  /^\/worlds\/[^/?]+\/compendium\/(?:(?:actors|locations|artifacts)(?:\/[^/?]+\/page)?|timeline)(?:\?viewer=[^/]*)?$/;

function urlOf(call: unknown[]): string {
  return String(call[0]);
}

describe("api network allowlist", () => {
  beforeEach(() => {
    history.replaceState({}, "", "/"); // no ?viewer=
  });
  afterEach(() => vi.unstubAllGlobals());

  it("only ever requests published compendium endpoints", async () => {
    const spy = vi.fn().mockResolvedValue(jsonResponse(indexFixture("actor")));
    vi.stubGlobal("fetch", spy);

    await fetchIndex(WORLD, "actors");
    await fetchIndex(WORLD, "locations");
    await fetchIndex(WORLD, "artifacts");
    await fetchPage(WORLD, "actors", ID);
    await fetchPage(WORLD, "locations", ID);
    await fetchPage(WORLD, "artifacts", ID);
    await fetchTimeline(WORLD);

    expect(spy).toHaveBeenCalledTimes(7);
    for (const call of spy.mock.calls) {
      expect(urlOf(call)).toMatch(ALLOWED);
    }
  });
});

describe("api ?viewer= forwarding", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards viewer=X verbatim on every surface when present", async () => {
    history.replaceState({}, "", "/?viewer=X#/actors");
    const spy = vi.fn().mockResolvedValue(jsonResponse(indexFixture("actor")));
    vi.stubGlobal("fetch", spy);

    await fetchIndex(WORLD, "actors");
    await fetchIndex(WORLD, "locations");
    await fetchIndex(WORLD, "artifacts");
    await fetchPage(WORLD, "actors", ID);
    await fetchPage(WORLD, "locations", ID);
    await fetchPage(WORLD, "artifacts", ID);
    await fetchTimeline(WORLD);

    expect(spy).toHaveBeenCalledTimes(7);
    for (const call of spy.mock.calls) {
      expect(urlOf(call)).toContain("viewer=X");
    }
  });

  it("omits the viewer param entirely when absent", async () => {
    history.replaceState({}, "", "/");
    const spy = vi.fn().mockResolvedValue(jsonResponse(timeline));
    vi.stubGlobal("fetch", spy);

    await fetchTimeline(WORLD);

    expect(urlOf(spy.mock.calls[0])).not.toContain("viewer");
  });
});

describe("api status handling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves a 404 to the NOT_FOUND sentinel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)));
    const result = await fetchPage(WORLD, "actors", ID);
    expect(result).toBe(NOT_FOUND);
  });

  it("throws on a non-404 failure (so it never renders as not-found)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(fetchPage(WORLD, "actors", ID)).rejects.toThrow();
  });

  it("returns the parsed payload on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(actorPage)));
    const result = await fetchPage(WORLD, "actors", ID);
    expect(result).toEqual(actorPage);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/api.test.ts`
Expected: FAIL — `fetchIndex`/`fetchTimeline`/`NOT_FOUND` not exported from `./api` (current `api.ts` only has `fetchActorPage`).

- [ ] **Step 4: Rewrite `src/api.ts`**

Replace the entire file with:

```ts
import type { ActorPage } from "./types/actor_page";
import type { LocationPage } from "./types/location_page";
import type { ArtifactPage } from "./types/artifact_page";
import type { Timeline } from "./types/timeline";
import type { CompendiumIndex } from "./types/compendium_index";

/** URL path segment for the published endpoints (always plural). */
export type Kind = "actors" | "locations" | "artifacts";

/** Single sentinel for "the API said 404". Carries NO withheld-vs-missing distinction. */
export const NOT_FOUND = Symbol("not_found");
export type Fetched<T> = T | typeof NOT_FOUND;

type PageOf<K extends Kind> = K extends "actors"
  ? ActorPage
  : K extends "locations"
    ? LocationPage
    : ArtifactPage;

/** Read the debug viewer override from the page URL. Never interpreted — only forwarded. */
function viewerParam(): string | null {
  return new URLSearchParams(location.search).get("viewer");
}

/**
 * The ONLY place request URLs are constructed. Can only ever produce
 * `/worlds/{w}/compendium/...` paths, optionally carrying `?viewer=`.
 */
function compendiumUrl(world: string, segments: string[]): string {
  const path = segments.map(encodeURIComponent).join("/");
  const base = `/worlds/${encodeURIComponent(world)}/compendium/${path}`;
  const viewer = viewerParam();
  return viewer === null ? base : `${base}?viewer=${encodeURIComponent(viewer)}`;
}

/** Fetch + status handling shared by every endpoint. 404 → NOT_FOUND; non-404 failure → throw. */
async function getJson<T>(url: string): Promise<Fetched<T>> {
  const res = await fetch(url);
  if (res.status === 404) return NOT_FOUND;
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return (await res.json()) as T;
}

export function fetchIndex(world: string, kind: Kind): Promise<Fetched<CompendiumIndex>> {
  return getJson<CompendiumIndex>(compendiumUrl(world, [kind]));
}

export function fetchPage<K extends Kind>(
  world: string,
  kind: K,
  id: string,
): Promise<Fetched<PageOf<K>>> {
  return getJson<PageOf<K>>(compendiumUrl(world, [kind, id, "page"]));
}

export function fetchTimeline(world: string): Promise<Fetched<Timeline>> {
  return getJson<Timeline>(compendiumUrl(world, ["timeline"]));
}
```

- [ ] **Step 5: Run the API tests to verify they pass**

Run: `npm test -- src/api.test.ts`
Expected: PASS — all api tests green.

- [ ] **Step 6: Commit**

```bash
git add src/api.ts src/api.test.ts src/test/fixtures.ts
git commit -m "feat: API layer with single URL chokepoint, viewer passthrough, NOT_FOUND sentinel"
```

---

## Task 4: Shared presentation components

Extract the reusable pieces. `KnowledgeGroups` lifts the existing actor-page markup verbatim so
the later ActorPage regression test passes unchanged.

**Files:**
- Create: `src/components/PageShell.tsx`
- Create: `src/components/NotFound.tsx`
- Create: `src/components/LoadError.tsx`
- Create: `src/components/KnowledgeGroups.tsx`
- Create: `src/components/NotFound.test.tsx`

- [ ] **Step 1: Write the failing NotFound indistinguishability test**

Create `src/components/NotFound.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotFound } from "./NotFound";

describe("NotFound", () => {
  it("renders identical output regardless of why the entity is absent", () => {
    // A withheld id and a nonexistent id both reach this component the same way:
    // there is no prop that distinguishes them, so the output cannot differ.
    const withheld = render(<NotFound />).container.innerHTML;
    const missing = render(<NotFound />).container.innerHTML;
    expect(withheld).toBe(missing);
  });

  it("shows a neutral not-found message", () => {
    const { getByText } = render(<NotFound />);
    expect(getByText(/not found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/components/NotFound.test.tsx`
Expected: FAIL — cannot resolve `./NotFound`.

- [ ] **Step 3: Create `src/components/NotFound.tsx`**

```tsx
/**
 * The single not-found state. Takes NO props: a withheld entity and a genuinely
 * nonexistent one both arrive here via an identical 404, so nothing can branch the UI.
 */
export function NotFound() {
  return (
    <main style={{ maxWidth: 680, margin: "2rem auto", fontFamily: "system-ui" }}>
      <p>Not found.</p>
    </main>
  );
}
```

- [ ] **Step 4: Create `src/components/LoadError.tsx`**

```tsx
/** Generic load failure (non-404). Kept distinct from NotFound so an outage never reads as "not found". */
export function LoadError() {
  return (
    <main style={{ maxWidth: 680, margin: "2rem auto", fontFamily: "system-ui" }}>
      <p>Could not load this page.</p>
    </main>
  );
}
```

- [ ] **Step 5: Create `src/components/PageShell.tsx`**

```tsx
import type { ReactNode } from "react";

/** Shared page frame: the <main> wrapper, a heading, and an optional subtitle line. */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | null;
  children: ReactNode;
}) {
  return (
    <main style={{ maxWidth: 680, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>{title}</h1>
      {subtitle && <p style={{ color: "#666" }}>{subtitle}</p>}
      {children}
    </main>
  );
}
```

- [ ] **Step 6: Create `src/components/KnowledgeGroups.tsx`** (markup lifted verbatim from the current ActorPage)

```tsx
type KnowledgeItem = {
  perception_id: string;
  content: string;
  epistemic_type: string;
  display_label: string | null;
  decay: { [k: string]: unknown };
};

type KnowledgeGroup = {
  group_key: string;
  group_label: string | null;
  items: KnowledgeItem[];
};

/** Renders collected_knowledge_groups. Shared by actor/location/artifact pages. */
export function KnowledgeGroups({
  groups,
  emptyMessage,
}: {
  groups: KnowledgeGroup[];
  emptyMessage: string;
}) {
  const hasKnowledge = groups.some((g) => (g.items ?? []).length > 0);
  return (
    <section>
      <h2>Collected Knowledge</h2>
      {!hasKnowledge && (
        <p>
          <em>{emptyMessage}</em>
        </p>
      )}
      {groups.map((g) => (
        <div key={g.group_key}>
          {g.group_label && <h3>{g.group_label}</h3>}
          <ul>
            {(g.items ?? []).map((it) => (
              <li key={it.perception_id} style={{ marginBottom: "0.5rem" }}>
                <div>{it.content}</div>
                <small style={{ color: "#888" }}>
                  {it.epistemic_type}
                  {it.display_label ? ` · ${it.display_label}` : ""}
                  {it.decay && (it.decay as { stale?: boolean }).stale ? " · last known…" : ""}
                </small>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 7: Run the NotFound test to verify it passes**

Run: `npm test -- src/components/NotFound.test.tsx`
Expected: PASS.

- [ ] **Step 8: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/PageShell.tsx src/components/NotFound.tsx src/components/LoadError.tsx src/components/KnowledgeGroups.tsx src/components/NotFound.test.tsx
git commit -m "feat: shared presentation components (PageShell, NotFound, LoadError, KnowledgeGroups)"
```

---

## Task 5: Refactor ActorPage onto shared components, pinned by a regression test

`ActorPage` moves to `src/pages/` and consumes the shared components. The regression test
(spec Test 6) pins its rendered output; spec Tests 1 and 7 (withheld name → placeholder, honest
nulls) are covered here too.

**Files:**
- Create: `src/pages/ActorPage.tsx`
- Delete: `src/ActorPage.tsx`
- Create: `src/pages/ActorPage.test.tsx`
- Modify: `src/main.tsx` (update the import path so the app still builds)

- [ ] **Step 1: Write the failing ActorPage tests**

Create `src/pages/ActorPage.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ActorPage } from "./ActorPage";
import { WORLD, ID, actorPage, actorPageWithheld } from "../test/fixtures";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, fetchPage: vi.fn() };
});
import { fetchPage, NOT_FOUND } from "../api";

afterEach(() => vi.clearAllMocks());

describe("ActorPage", () => {
  it("renders the perceived name, role, synthesis, last-known and knowledge", async () => {
    vi.mocked(fetchPage).mockResolvedValue(actorPage);
    render(<ActorPage world={WORLD} actorId={ID} />);

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mara"));
    expect(screen.getByText("innkeeper")).toBeInTheDocument();
    expect(screen.getByText("Keeps the tavern on the south road.")).toBeInTheDocument();
    expect(screen.getByText("Behind the bar, last seen at dusk.")).toBeInTheDocument();
    expect(screen.getByText("Saw her pour ale for a hooded traveler.")).toBeInTheDocument();
  });

  it("renders 'Unknown' for a withheld name and leaks no canon name", async () => {
    vi.mocked(fetchPage).mockResolvedValue(actorPageWithheld);
    const { container } = render(<ActorPage world={WORLD} actorId={ID} />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Unknown"),
    );
    // The fixture carries no canon name; assert none of the populated-fixture strings appear.
    expect(container.textContent).not.toContain("Mara");
    expect(container.textContent).not.toContain("innkeeper");
  });

  it("renders a null synthesis as absent text, never a fabricated value", async () => {
    vi.mocked(fetchPage).mockResolvedValue(actorPageWithheld);
    render(<ActorPage world={WORLD} actorId={ID} />);
    await waitFor(() => expect(screen.getByText(/nothing synthesized yet/i)).toBeInTheDocument());
  });

  it("renders the NotFound state on a 404", async () => {
    vi.mocked(fetchPage).mockResolvedValue(NOT_FOUND);
    render(<ActorPage world={WORLD} actorId={ID} />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/pages/ActorPage.test.tsx`
Expected: FAIL — cannot resolve `./ActorPage` (not yet under `src/pages/`).

- [ ] **Step 3: Create `src/pages/ActorPage.tsx`** (refactored onto shared components)

```tsx
import { useEffect, useState } from "react";
import type { ActorPage as ActorPageT } from "../types/actor_page";
import { fetchPage, NOT_FOUND, type Fetched } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";
import { KnowledgeGroups } from "../components/KnowledgeGroups";

export function ActorPage({ world, actorId }: { world: string; actorId: string }) {
  const [page, setPage] = useState<Fetched<ActorPageT> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPage(null);
    setFailed(false);
    fetchPage(world, "actors", actorId)
      .then(setPage)
      .catch(() => setFailed(true));
  }, [world, actorId]);

  if (failed) return <LoadError />;
  if (page === null) return <main>Loading…</main>;
  if (page === NOT_FOUND) return <NotFound />;

  const a = page.actor;
  return (
    <PageShell title={a.perceived_name ?? "Unknown"} subtitle={a.perceived_role}>
      <section>
        <h2>Synthesis</h2>
        <p>{a.current_synthesis ?? <em>Nothing synthesized yet.</em>}</p>
      </section>
      {a.last_known_status && (
        <section>
          <h2>Last known</h2>
          <p>{a.last_known_status}</p>
        </section>
      )}
      <KnowledgeGroups
        groups={a.collected_knowledge_groups}
        emptyMessage="You know nothing about them yet."
      />
    </PageShell>
  );
}
```

- [ ] **Step 4: Delete the old file and fix the `main.tsx` import**

```bash
git rm src/ActorPage.tsx
```

In `src/main.tsx`, change the import line from `import { ActorPage } from "./ActorPage";` to:

```ts
import { ActorPage } from "./pages/ActorPage";
```

- [ ] **Step 5: Run the ActorPage tests to verify they pass**

Run: `npm test -- src/pages/ActorPage.test.tsx`
Expected: PASS — all four tests green.

- [ ] **Step 6: Verify the build still compiles**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ActorPage.tsx src/pages/ActorPage.test.tsx src/main.tsx
git commit -m "refactor: ActorPage onto shared components, pinned by regression test"
```

---

## Task 6: IndexList — renders exactly the returned entries, in order

Covers spec Test 3 (no client-side filtering, sorting, or additions).

**Files:**
- Create: `src/pages/IndexList.tsx`
- Create: `src/pages/IndexList.test.tsx`

- [ ] **Step 1: Write the failing IndexList test**

Create `src/pages/IndexList.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { IndexList } from "./IndexList";
import { WORLD, indexFixture } from "../test/fixtures";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, fetchIndex: vi.fn() };
});
import { fetchIndex, NOT_FOUND } from "../api";

afterEach(() => vi.clearAllMocks());

describe("IndexList", () => {
  it("renders exactly the returned entries, in received order, with no additions", async () => {
    vi.mocked(fetchIndex).mockResolvedValue(indexFixture("actor"));
    render(<IndexList world={WORLD} kind="actors" />);

    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(3); // exactly the three fixture entries

    // received order is preserved
    expect(links[0]).toHaveTextContent("Mara");
    expect(links[1]).toHaveTextContent("Unknown"); // null perceived_name → placeholder
    expect(links[2]).toHaveTextContent("The Last Lantern");

    // each links to its own page via the hash route
    expect(links[0]).toHaveAttribute("href", "#/actors/11111111-1111-1111-1111-111111111101");
  });

  it("renders NotFound on a 404", async () => {
    vi.mocked(fetchIndex).mockResolvedValue(NOT_FOUND);
    render(<IndexList world={WORLD} kind="actors" />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/pages/IndexList.test.tsx`
Expected: FAIL — cannot resolve `./IndexList`.

- [ ] **Step 3: Create `src/pages/IndexList.tsx`**

```tsx
import { useEffect, useState } from "react";
import type { CompendiumIndex } from "../types/compendium_index";
import { fetchIndex, NOT_FOUND, type Fetched, type Kind } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";

const TITLES: Record<Kind, string> = {
  actors: "Actors",
  locations: "Locations",
  artifacts: "Artifacts",
};

export function IndexList({ world, kind }: { world: string; kind: Kind }) {
  const [data, setData] = useState<Fetched<CompendiumIndex> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setData(null);
    setFailed(false);
    fetchIndex(world, kind)
      .then(setData)
      .catch(() => setFailed(true));
  }, [world, kind]);

  if (failed) return <LoadError />;
  if (data === null) return <main>Loading…</main>;
  if (data === NOT_FOUND) return <NotFound />;

  // Render entries exactly as received — no filtering, sorting, or additions.
  return (
    <PageShell title={TITLES[kind]}>
      <ul>
        {data.entries.map((e) => (
          <li key={e.id}>
            <a href={`#/${kind}/${e.id}`}>{e.perceived_name ?? "Unknown"}</a>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
```

- [ ] **Step 4: Run the IndexList tests to verify they pass**

Run: `npm test -- src/pages/IndexList.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/IndexList.tsx src/pages/IndexList.test.tsx
git commit -m "feat: IndexList renders returned entries verbatim, in order"
```

---

## Task 7: LocationPage and ArtifactPage

**Files:**
- Create: `src/pages/LocationPage.tsx`
- Create: `src/pages/ArtifactPage.tsx`
- Create: `src/pages/LocationPage.test.tsx`
- Create: `src/pages/ArtifactPage.test.tsx`

- [ ] **Step 1: Write the failing LocationPage test**

Create `src/pages/LocationPage.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LocationPage } from "./LocationPage";
import { WORLD, ID, locationPage } from "../test/fixtures";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, fetchPage: vi.fn() };
});
import { fetchPage, NOT_FOUND } from "../api";

afterEach(() => vi.clearAllMocks());

describe("LocationPage", () => {
  it("renders perceived name, part-of, synthesis, last-known", async () => {
    vi.mocked(fetchPage).mockResolvedValue(locationPage);
    render(<LocationPage world={WORLD} locationId={ID} />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Last Lantern"),
    );
    expect(screen.getByText("Greywater")).toBeInTheDocument();
    expect(screen.getByText("A tavern by the docks.")).toBeInTheDocument();
    expect(screen.getByText("Lights on, door open.")).toBeInTheDocument();
  });

  it("renders NotFound on a 404", async () => {
    vi.mocked(fetchPage).mockResolvedValue(NOT_FOUND);
    render(<LocationPage world={WORLD} locationId={ID} />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Write the failing ArtifactPage test**

Create `src/pages/ArtifactPage.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ArtifactPage } from "./ArtifactPage";
import { WORLD, ID, artifactPage } from "../test/fixtures";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, fetchPage: vi.fn() };
});
import { fetchPage, NOT_FOUND } from "../api";

afterEach(() => vi.clearAllMocks());

describe("ArtifactPage", () => {
  it("renders perceived name, type, synthesis, last-known location, holder", async () => {
    vi.mocked(fetchPage).mockResolvedValue(artifactPage);
    render(<ArtifactPage world={WORLD} artifactId={ID} />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bone Key"),
    );
    expect(screen.getByText("key")).toBeInTheDocument();
    expect(screen.getByText("An old key of yellowed bone.")).toBeInTheDocument();
    expect(screen.getByText("On a hook behind the bar.")).toBeInTheDocument();
    expect(screen.getByText("Held by the innkeeper.")).toBeInTheDocument();
  });

  it("renders NotFound on a 404", async () => {
    vi.mocked(fetchPage).mockResolvedValue(NOT_FOUND);
    render(<ArtifactPage world={WORLD} artifactId={ID} />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 3: Run both to verify they fail**

Run: `npm test -- src/pages/LocationPage.test.tsx src/pages/ArtifactPage.test.tsx`
Expected: FAIL — cannot resolve `./LocationPage` / `./ArtifactPage`.

- [ ] **Step 4: Create `src/pages/LocationPage.tsx`**

```tsx
import { useEffect, useState } from "react";
import type { LocationPage as LocationPageT } from "../types/location_page";
import { fetchPage, NOT_FOUND, type Fetched } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";
import { KnowledgeGroups } from "../components/KnowledgeGroups";

export function LocationPage({ world, locationId }: { world: string; locationId: string }) {
  const [page, setPage] = useState<Fetched<LocationPageT> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPage(null);
    setFailed(false);
    fetchPage(world, "locations", locationId)
      .then(setPage)
      .catch(() => setFailed(true));
  }, [world, locationId]);

  if (failed) return <LoadError />;
  if (page === null) return <main>Loading…</main>;
  if (page === NOT_FOUND) return <NotFound />;

  const l = page.location;
  return (
    <PageShell title={l.perceived_name ?? "Unknown"} subtitle={l.part_of}>
      <section>
        <h2>Synthesis</h2>
        <p>{l.current_synthesis ?? <em>Nothing synthesized yet.</em>}</p>
      </section>
      {l.last_known_status && (
        <section>
          <h2>Last known</h2>
          <p>{l.last_known_status}</p>
        </section>
      )}
      <KnowledgeGroups
        groups={l.collected_knowledge_groups}
        emptyMessage="You know nothing about this place yet."
      />
    </PageShell>
  );
}
```

- [ ] **Step 5: Create `src/pages/ArtifactPage.tsx`**

```tsx
import { useEffect, useState } from "react";
import type { ArtifactPage as ArtifactPageT } from "../types/artifact_page";
import { fetchPage, NOT_FOUND, type Fetched } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";
import { KnowledgeGroups } from "../components/KnowledgeGroups";

export function ArtifactPage({ world, artifactId }: { world: string; artifactId: string }) {
  const [page, setPage] = useState<Fetched<ArtifactPageT> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPage(null);
    setFailed(false);
    fetchPage(world, "artifacts", artifactId)
      .then(setPage)
      .catch(() => setFailed(true));
  }, [world, artifactId]);

  if (failed) return <LoadError />;
  if (page === null) return <main>Loading…</main>;
  if (page === NOT_FOUND) return <NotFound />;

  const a = page.artifact;
  return (
    <PageShell title={a.perceived_name ?? "Unknown"} subtitle={a.perceived_type}>
      <section>
        <h2>Synthesis</h2>
        <p>{a.current_synthesis ?? <em>Nothing synthesized yet.</em>}</p>
      </section>
      {a.last_known_location && (
        <section>
          <h2>Last known location</h2>
          <p>{a.last_known_location}</p>
        </section>
      )}
      {a.current_holder_owner_access && (
        <section>
          <h2>Holder</h2>
          <p>{a.current_holder_owner_access}</p>
        </section>
      )}
      <KnowledgeGroups
        groups={a.collected_knowledge_groups}
        emptyMessage="You know nothing about this object yet."
      />
    </PageShell>
  );
}
```

- [ ] **Step 6: Run both tests to verify they pass**

Run: `npm test -- src/pages/LocationPage.test.tsx src/pages/ArtifactPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/LocationPage.tsx src/pages/ArtifactPage.tsx src/pages/LocationPage.test.tsx src/pages/ArtifactPage.test.tsx
git commit -m "feat: LocationPage and ArtifactPage on shared components"
```

---

## Task 8: Timeline — render records in received order

**Files:**
- Create: `src/pages/Timeline.tsx`
- Create: `src/pages/Timeline.test.tsx`

- [ ] **Step 1: Write the failing Timeline test**

Create `src/pages/Timeline.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Timeline } from "./Timeline";
import { WORLD, timeline } from "../test/fixtures";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, fetchTimeline: vi.fn() };
});
import { fetchTimeline, NOT_FOUND } from "../api";

afterEach(() => vi.clearAllMocks());

describe("Timeline", () => {
  it("renders records in the received order, with no client-side sort", async () => {
    vi.mocked(fetchTimeline).mockResolvedValue(timeline);
    render(<Timeline world={WORLD} />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    // fixture order is preserved exactly (tick 5 before tick 9, as received)
    expect(items[0]).toHaveTextContent("A bell rang in the harbor.");
    expect(items[1]).toHaveTextContent("Smoke rose over the hill.");
  });

  it("renders NotFound on a 404", async () => {
    vi.mocked(fetchTimeline).mockResolvedValue(NOT_FOUND);
    render(<Timeline world={WORLD} />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/pages/Timeline.test.tsx`
Expected: FAIL — cannot resolve `./Timeline`.

- [ ] **Step 3: Create `src/pages/Timeline.tsx`**

```tsx
import { useEffect, useState } from "react";
import type { Timeline as TimelineT } from "../types/timeline";
import { fetchTimeline, NOT_FOUND, type Fetched } from "../api";
import { PageShell } from "../components/PageShell";
import { NotFound } from "../components/NotFound";
import { LoadError } from "../components/LoadError";

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

  // Render in the order received — the API already orders by valid_tick; no client sort.
  return (
    <PageShell title="Timeline">
      <ul>
        {data.records.map((r) => (
          <li key={r.perception_id} style={{ marginBottom: "0.5rem" }}>
            <div>{r.content}</div>
            <small style={{ color: "#888" }}>
              {r.epistemic_type}
              {r.display_label ? ` · ${r.display_label}` : ""}
            </small>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
```

- [ ] **Step 4: Run the Timeline test to verify it passes**

Run: `npm test -- src/pages/Timeline.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Timeline.tsx src/pages/Timeline.test.tsx
git commit -m "feat: Timeline renders records in received order"
```

---

## Task 9: Hash router and app entry

A zero-dep hash router selects the surface and preserves `?viewer=` (it lives in
`location.search`, not the hash). `main.tsx` mounts the router instead of a single hardcoded page.

**Files:**
- Create: `src/router.tsx`
- Create: `src/router.test.tsx`
- Modify: `src/main.tsx` (mount `<App />`)

- [ ] **Step 1: Write the failing router test**

Create `src/router.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { parseHash } from "./router";

describe("parseHash", () => {
  it("routes index lists", () => {
    expect(parseHash("#/actors")).toEqual({ surface: "index", kind: "actors" });
    expect(parseHash("#/locations")).toEqual({ surface: "index", kind: "locations" });
    expect(parseHash("#/artifacts")).toEqual({ surface: "index", kind: "artifacts" });
  });

  it("routes entity pages", () => {
    expect(parseHash("#/actors/abc")).toEqual({ surface: "page", kind: "actors", id: "abc" });
    expect(parseHash("#/locations/xyz")).toEqual({ surface: "page", kind: "locations", id: "xyz" });
    expect(parseHash("#/artifacts/q1")).toEqual({ surface: "page", kind: "artifacts", id: "q1" });
  });

  it("routes the timeline", () => {
    expect(parseHash("#/timeline")).toEqual({ surface: "timeline" });
  });

  it("falls back to home for empty or unknown hashes", () => {
    expect(parseHash("")).toEqual({ surface: "home" });
    expect(parseHash("#/")).toEqual({ surface: "home" });
    expect(parseHash("#/nonsense/path/extra")).toEqual({ surface: "home" });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/router.test.tsx`
Expected: FAIL — cannot resolve `./router`.

- [ ] **Step 3: Create `src/router.tsx`**

```tsx
import { useEffect, useState } from "react";
import type { Kind } from "./api";
import { IndexList } from "./pages/IndexList";
import { ActorPage } from "./pages/ActorPage";
import { LocationPage } from "./pages/LocationPage";
import { ArtifactPage } from "./pages/ArtifactPage";
import { Timeline } from "./pages/Timeline";
import { PageShell } from "./components/PageShell";

// The world is fixed for this read-only shell; the operator selects the viewer via ?viewer=.
const WORLD = "11111111-1111-1111-1111-111111111111";

const KINDS: Kind[] = ["actors", "locations", "artifacts"];

export type Route =
  | { surface: "home" }
  | { surface: "index"; kind: Kind }
  | { surface: "page"; kind: Kind; id: string }
  | { surface: "timeline" };

function isKind(s: string): s is Kind {
  return (KINDS as string[]).includes(s);
}

/** Pure hash → route parser (unit-tested directly). */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "");
  const parts = path.split("/").filter(Boolean); // "#/actors/abc" → ["actors","abc"]

  if (parts.length === 0) return { surface: "home" };
  if (parts.length === 1 && parts[0] === "timeline") return { surface: "timeline" };
  if (parts.length === 1 && isKind(parts[0])) return { surface: "index", kind: parts[0] };
  if (parts.length === 2 && isKind(parts[0])) {
    return { surface: "page", kind: parts[0], id: parts[1] };
  }
  return { surface: "home" };
}

function Home() {
  return (
    <PageShell title="Compendium">
      <ul>
        <li>
          <a href="#/actors">Actors</a>
        </li>
        <li>
          <a href="#/locations">Locations</a>
        </li>
        <li>
          <a href="#/artifacts">Artifacts</a>
        </li>
        <li>
          <a href="#/timeline">Timeline</a>
        </li>
      </ul>
    </PageShell>
  );
}

function render(route: Route) {
  switch (route.surface) {
    case "home":
      return <Home />;
    case "index":
      return <IndexList world={WORLD} kind={route.kind} />;
    case "timeline":
      return <Timeline world={WORLD} />;
    case "page":
      if (route.kind === "actors") return <ActorPage world={WORLD} actorId={route.id} />;
      if (route.kind === "locations") return <LocationPage world={WORLD} locationId={route.id} />;
      return <ArtifactPage world={WORLD} artifactId={route.id} />;
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return render(route);
}
```

- [ ] **Step 4: Run the router test to verify it passes**

Run: `npm test -- src/router.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rewrite `src/main.tsx` to mount the router**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./router";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Verify the full build compiles**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — `tsc` clean, `vite build` produces `dist/`.

- [ ] **Step 7: Commit**

```bash
git add src/router.tsx src/router.test.tsx src/main.tsx
git commit -m "feat: zero-dep hash router and app entry"
```

---

## Task 10: Structural no-leak guard — no fetch outside the api chokepoint

A cheap source-scan test proving every network call originates in `src/api.ts`, so the
allowlist test in Task 3 covers all of the FE's network behavior.

**Files:**
- Create: `src/test/no-stray-fetch.test.ts`

- [ ] **Step 1: Write the failing guard test**

Create `src/test/no-stray-fetch.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return p.endsWith(".ts") || p.endsWith(".tsx") ? [p] : [];
  });
}

describe("no stray network calls", () => {
  it("only src/api.ts calls fetch()", () => {
    const offenders = walk("src")
      .filter((f) => !f.endsWith("api.ts")) // the one allowed chokepoint
      .filter((f) => !f.includes(".test.")) // tests legitimately stub/spy fetch
      .filter((f) => !f.endsWith("fixtures.ts")) // fixtures build Response objects
      .filter((f) => /\bfetch\s*\(/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it — it should PASS immediately**

Run: `npm test -- src/test/no-stray-fetch.test.ts`
Expected: PASS (no component calls `fetch` directly; only `api.ts` does). If it fails, a component is bypassing the chokepoint — move that call into `api.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/test/no-stray-fetch.test.ts
git commit -m "test: guard that fetch() only lives in the api chokepoint"
```

---

## Task 11: Drift gates and CI

Wire the two drift checks and make `verify:types` an automated gate. `verify:contract` stays
opt-in (needs backend) and is enforced via the PR checklist.

**Files:**
- Create: `scripts/verify-types.sh`
- Create: `scripts/verify-contract.sh`
- Modify: `package.json` (scripts)
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `scripts/verify-types.sh`** (hermetic; regen and diff)

```bash
#!/usr/bin/env bash
# Fails if src/types/ drifts from the vendored contracts/ schemas.
set -euo pipefail

declare -a PAIRS=(
  "contracts/actor_page.v1.schema.json:src/types/actor_page.ts"
  "contracts/location_page.v1.schema.json:src/types/location_page.ts"
  "contracts/artifact_page.v1.schema.json:src/types/artifact_page.ts"
  "contracts/timeline.v1.schema.json:src/types/timeline.ts"
  "contracts/compendium_index.v1.schema.json:src/types/compendium_index.ts"
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

status=0
for pair in "${PAIRS[@]}"; do
  schema="${pair%%:*}"
  out="${pair##*:}"
  ./node_modules/.bin/json2ts -i "$schema" > "$tmp/gen.ts"
  if ! diff -u "$out" "$tmp/gen.ts"; then
    echo "DRIFT: $out does not match codegen from $schema" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "verify:types OK — generated types match vendored schemas"
fi
exit "$status"
```

- [ ] **Step 2: Create `scripts/verify-contract.sh`** (opt-in; needs backend)

```bash
#!/usr/bin/env bash
# Fails if vendored contracts/ drift from backend main. Source of truth:
# the local sibling clone if readable, else raw.githubusercontent backend main.
set -euo pipefail

SIBLING="/Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema"
RAW="https://raw.githubusercontent.com/zakkriel/dreamchat-world-backend/main/core/api/schema"

declare -a FILES=(
  actor_page.v1.schema.json
  location_page.v1.schema.json
  artifact_page.v1.schema.json
  timeline.v1.schema.json
  compendium_index.v1.schema.json
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fetch_upstream() {
  local file="$1" dest="$2"
  if [ -r "$SIBLING/$file" ]; then
    cp "$SIBLING/$file" "$dest"
  else
    curl -fsSL "$RAW/$file" -o "$dest"
  fi
}

status=0
for file in "${FILES[@]}"; do
  fetch_upstream "$file" "$tmp/$file"
  if ! diff -u "contracts/$file" "$tmp/$file"; then
    echo "DRIFT: contracts/$file differs from backend main" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "verify:contract OK — vendored schemas match backend main"
fi
exit "$status"
```

- [ ] **Step 3: Make the scripts executable and add npm scripts**

```bash
chmod +x scripts/verify-types.sh scripts/verify-contract.sh
```

In `package.json` `scripts`, add:

```json
    "verify:types": "bash scripts/verify-types.sh",
    "verify:contract": "bash scripts/verify-contract.sh",
```

- [ ] **Step 4: Run both drift checks locally**

Run: `npm run verify:types && npm run verify:contract`
Expected: both print `OK` (the committed types match the vendored schemas, and the vendored schemas match backend main).

- [ ] **Step 5: Create `.github/workflows/ci.yml`** (makes `verify:types` and tests a real gate)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm run verify:types
      - run: npm run build
      - run: npm test
```

> Note: `verify:contract` is intentionally NOT in CI — it requires the backend repo. It is a
> required, ticked step in the PR checklist (Task 12) and on every re-vendor.

- [ ] **Step 6: Verify the whole gate passes locally**

Run: `npm run verify:types && npm run build && npm test`
Expected: all PASS — drift check clean, build clean, every test green.

- [ ] **Step 7: Commit**

```bash
git add scripts package.json .github/workflows/ci.yml
git commit -m "ci: drift gates (verify:types in CI, verify:contract opt-in) and build/test workflow"
```

---

## Task 12: Final wiring — README and PR checklist

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the surfaces, scripts, and the required contract check**

Append to `README.md` (create the section if the file is sparse):

```markdown
## Compendium FE (Chunk-4)

Read-only presentation over the published Compendium contract. Presentation only — never world
truth (D-7). The FE renders exactly what the API returns and adds no filtering, sorting, or canon
lookups of its own.

### Surfaces (hash routes)
- `#/actors`, `#/locations`, `#/artifacts` — index lists
- `#/actors/:id`, `#/locations/:id`, `#/artifacts/:id` — entity pages
- `#/timeline` — timeline (rendered in the order the API returns)
- Append `?viewer=<uuid>` to browse as a specific viewer (Player / Jonas). The FE forwards it
  verbatim and behaves identically regardless of value.

### Scripts
- `npm run dev` — Vite dev server (proxies `/worlds` → `BACKEND_URL`, default `http://localhost:8080`)
- `npm run build` — `tsc && vite build`
- `npm test` — Vitest suite (proves the FE cannot leak)
- `npm run gen:types` — regenerate `src/types/` from `contracts/`
- `npm run verify:types` — fail if `src/types/` drift from `contracts/` (runs in CI)
- `npm run verify:contract` — fail if `contracts/` drift from backend main (needs backend)

### Contract
`contracts/` holds the five published schemas vendored from `dreamchat-world-backend` main. They
are the source of truth for `src/types/`. To update: re-copy from backend main, run
`npm run gen:types`, then `npm run verify:contract`.

### PR / merge checklist
- [ ] `npm run verify:types` passes (CI enforces this)
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run verify:contract` passes — **required on every PR and every re-vendor**
```

- [ ] **Step 2: Final full verification**

Run: `npm run verify:types && npm run verify:contract && npm run build && npm test`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Compendium FE surfaces, scripts, and contract checklist"
```

---

## Done criteria

- All five schemas vendored under `contracts/`; `src/types/` codegen'd from them; `verify:types` green.
- Seven surfaces render via the hash router; `?viewer=` forwarded verbatim, never interpreted.
- 404 → single identical `NotFound`; non-404 → distinct `LoadError`.
- All opaque arrays (`inline_links`, `known_artifacts`, `known_areas_inside`, `key_actors`) unrendered.
- Tests green and prove: withheld name → placeholder w/ no canon leak; 404 indistinguishable;
  index renders returned entries verbatim in order; network allowlist; `?viewer=` forwarded on
  every surface; ActorPage refactor behavior-preserved; no `fetch` outside `api.ts`.
- One fresh branch off `main`, one PR to `main`. **No gate run, no tagging.** Summarize PR contents and stop.
```

