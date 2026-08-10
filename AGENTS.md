<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# dream-weaver-visuals — how two teams share one repo

This is the DreamChat frontend. **Lovable owns how it looks. The engineering side owns what is true.**
Both push to `main`. This file is the contract that keeps that from hurting.

---

## The seam

| Owner | Directories | Rule |
|---|---|---|
| **Lovable** (visuals) | `src/components/dc/`, `src/components/ui/`, `src/styles.css`, `src/assets/`, `public/` | Free rein. Tokens, layout, chrome, type, motion, ornament, composition. |
| **Engineering** (functionality) | `src/api/`, `src/laws/`, `src/routes/`, `contracts/`, `scripts/`, `.github/`, `src/fixtures/`, `src/types/` | Data, contracts, wiring, tests, CI. |

**Wiring happens by passing typed props into Lovable's components — never by restyling them.**
If a component needs different data, the route changes. If it needs to look different, Lovable changes it.

### Rules for the engineering side

1. **Do not restyle `components/dc/` or `components/ui/`.** If a component is visually wrong, say so;
   do not fix it here.
2. **Do not break Lovable's editability.** No framework swaps, no directory restructuring, no removing
   `@lovable.dev/vite-tanstack-config`. `bun run dev` must keep working exactly as the editor expects.
3. **Never add plugins to `vite.config.ts`** — the wrapper already includes TanStack devtools,
   `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, nitro and the error loggers. Extra
   config goes through the documented `vite: { … }` passthrough, which is all the dev proxy uses.
4. **Rebase our branches on Lovable's pushes; keep PRs small and fast** so `main` never diverges long.
   Never force-push `main` — it rewrites the editor's history.

### Rules for the visual side

5. **The law list is `docs/handoff/README.md` §3.** Thirteen numbered rules with reasons. They are not
   preferences; several exist because breaking them leaks what a character has not earned.
6. **Never invent a displayed value.** If a design needs a field that is not in `contracts/`, say so
   and we will ask the backend. That is a normal, welcome request. Filling the hole client-side is the
   one thing that cannot be undone quietly, because it looks like it works.
7. **World-authored strings render verbatim.** Restyle, wrap, size — never edit, summarise or reorder.

---

## Data

Every payload comes through `src/api/`. Nothing else fetches.

- **Pins are exact.** `src/api/index.ts` pins `world_directory/2`, `scene_current/3`, `beat_frame/3`,
  `carrying/1` by string equality. A mismatch fails the load rather than reading a v3 payload through
  v2 field access.
- **Types are generated.** `src/api/types/` is codegen from `contracts/`. **Never hand-edit it** —
  `bun run verify:types` diffs it byte-for-byte. Regenerate with `bun run gen:types`.
- **Schemas are vendored.** `contracts/` holds copies of the backend's schemas; `bun run
  verify:contract` fails if they drift from backend `main`. It is scoped to the contracts the built
  surfaces consume — add a file the same commit a surface starts reading it.
- **Offline falls back to fixtures.** `src/api/load.ts` returns a bundled capture when the backend is
  unreachable, and the surface says so. It deliberately does **not** fall back on 404 (a missing world
  must read as missing) or on a schema mismatch (that is the breakage the pin exists to surface).

### Running against the real backend

```bash
bun run dev --port 5273 --strictPort      # the app
# the backend is expected on :8080
BACKEND_URL=http://localhost:9000 bun run dev --port 5273   # or point it elsewhere
```

The dev proxy in `vite.config.ts` forwards `/worlds/*` to the backend, so every request is a
same-origin relative path and **the app needs no CORS grant**. In the Lovable preview there is no
proxy and no backend, so fetches fail and the fixtures render — which is why the fallback exists.

Port **5273** is this repo's. `dreamchat-frontend` (the donor repo) still owns `:5173`.

---

## The law tests

`src/laws/` runs in CI. They test rules, not appearance: no ticks or wall-clock on screen, no banned
vocabulary, no relationship UI, no severity taxonomy, no corrections affordance, no create-world
control, no session identity, no dead `href="#"` links, no payload string transformed on its way to
the DOM, no presigned URL or cache-buster in an image.

**They scan what a route can actually reach.** An unrouted component cannot violate anything on
screen, so the graph is walked from `src/routes/` and only mounted files are checked. Mount something
non-compliant and CI goes red immediately — that is the mechanism that lets a design tool push to
`main` without a human reading every diff.

**Known limitation, deliberately not papered over:** the law tests are static. They catch structural
violations in code — a dead link, a banned word in JSX, a tick interpolation. They cannot see a
violation that arrives as *data*. That gap is closed by the contract instead: every displayed value
now comes from a version-pinned payload, so there is no channel for invented content to arrive
through. If a component ever renders a hand-authored JSON blob again, the static tests will not save
us — that is why the mock below was moved out.

---

## The dashboard

`components/dc/DashboardHome`, `DashboardRail` and `DashboardPanel` are **kept and unrouted**.

They are good work and Lovable owns them, so they were not deleted. They are not mounted because the
surface they render is not one we can honestly ship: its data came from a hand-authored
`dashboard.mock.json` that matched no contract, and the rendered result broke the law list in nine
places — a wall-clock renewal date, "Online" presence dots, nav labels on the forbidden list with
eight dead destinations, a relationship-tools promise, three create-world affordances, and images
keyed by an index into a sprite sheet rather than by a payload path.

The mock now lives at **`docs/lovable-drafts/dashboard.mock.json`**. It was moved out of
`src/fixtures/` because sitting beside twelve real captured payloads made it indistinguishable from
one, and a future reader would reasonably assume it was real.

**To bring the dashboard back:** decide which panels have a contract behind them. "Your Worlds" maps
cleanly onto `world_directory/2` — which now carries `tagline`, `cover_image` and `last_place_label`,
three fields that did not exist when the dashboard was designed and which cover much of what it was
faking. Panels with no contract (Mods, Discover, Account/billing, presence) need a backend field
before they can render, and that is a conversation, not a client-side fix.

---

## Where things are

```
contracts/            vendored JSON Schemas — the authority on what data exists
docs/handoff/         the visual handoff pack: the brief, the law, per-surface payload notes
docs/lovable-drafts/  unrouted design drafts that have no contract behind them yet
src/api/              transport, pins, image URLs; src/api/types/ is CODEGEN
src/laws/             the rule tests
src/fixtures/         real captured payloads, offline fallback only
src/routes/           route-level wiring: chooses data, passes typed props
src/components/dc/    Lovable's components
src/components/ui/    vendored shadcn primitives
```

## Gates

```bash
bun run typecheck        # tsc --noEmit
bun run verify:types     # src/api/types/ vs contracts/     (hermetic)
bun run build
bun run test             # the law tests
bun run verify:contract  # contracts/ vs backend main       (needs the sibling clone or network)
```

All five run in CI on every PR. Then **drive it in a browser** against the live backend — every real
defect in this project's history was found by looking at the page, not by the suite.
