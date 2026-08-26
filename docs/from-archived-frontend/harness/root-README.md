# DreamChat Frontend

> **⚠️ ARCHIVED — every command below is historical. Do not follow it.**
>
> This repo is superseded by [`dream-weaver-visuals`](https://github.com/zakkriel/dream-weaver-visuals),
> the live DreamChat frontend, on dev port **5273**. See [`ARCHIVED.md`](./ARCHIVED.md) for what
> replaced it and why, and `workspace:ADR-W003` for the decision.
>
> Specifically **do not** run `npm install` / `npm run dev` on `:5173` (that port is retired with this
> repo), do not follow the three-service integration runbook below, do not run
> `npm run dev:fake-engine`, and do not use the PR/merge checklist — this repo takes no PRs. The
> workspace bring-up is `../stack.sh start`, which boots `dream-weaver-visuals`.
>
> The rest of this file is kept unchanged: it is the record of how the predecessor ran.

The web frontend for **DreamChat**, a persistent AI RPG world platform.

**This repo owns presentation only — it never owns world truth.** The backend
(`dreamchat-world-backend`) decides what is true and what the viewer is allowed
to know; this repo renders the perception-bound projection the API returns. See
[`AGENTS.md`](./AGENTS.md) for the governance entry point and iron rules
(presentation only, D-7).

This is the read-only **Compendium**: per-type index lists, Actor / Location /
Artifact pages, and a Timeline — each rendering exactly the perception-bound
projection the API returns, with no client-side filtering, sorting, or canon
lookups (D-7).

## Running it

```bash
npm install
npm run dev      # Vite dev server, default http://localhost:5173
```

`npm run dev` expects the **backend running on `:8080`**. The Vite dev server
proxies the projection API path (`/worlds/...`) to the backend so the page can
load without CORS config. The proxy target is configurable:

```bash
BACKEND_URL=http://localhost:9000 npm run dev
```

### Running against the full integrated stack

Three services, in this order. Each is optional in the sense that the one below it
still works without it — the world runs perfectly well with no image platform
attached, and portraits simply stay `null` (which is the ordinary state, D-8).

**1. The image platform** (optional — portraits). Publishes its API on host `:8081`,
because the backend owns `:8080`:

```bash
cd ../dreamchat-Image-Platform
make start                              # infra + api + worker, foreground; prints its dev tokens
curl -i http://localhost:8081/health    # expect 200
```

`make start` prints a `dci_dev_*` token to stdout **once** — that is the value the
backend wants below.

**2. The world backend** on `:8080`. The fake bridge binds every seat to a
deterministic stand-in, so the whole beat loop — scene state, journeys, Continue,
frames and the trace — is real with **no provider key**, while the narration itself
is a stub. Point it at the image platform to get portraits:

```bash
cd ../dreamchat-world-backend
DATABASE_URL='postgres://postgres:postgres@localhost:5432/dreamchat?sslmode=disable' \
DREAMCHAT_MODE=debug DREAMCHAT_BRIDGE=fake \
DREAMCHAT_IMAGE_BASE_URL=http://localhost:8081 \
DREAMCHAT_IMAGE_API_TOKEN=dci_dev_...  \
go run ./core/api
```

Omit the two `DREAMCHAT_IMAGE_*` variables and every image reference stays `null` —
the app renders silhouettes and nothing breaks.

**3. This app:**

```bash
npm ci
npm run dev        # http://localhost:5173
```

It lands on the **world picker**, which reads `GET /worlds` and lists every world
open to you with its own name and look. Choose one and you are in it — the play
world is the seeded Drowned Lantern, whose player character is Kade, resolved from
the world record. **Nothing in the URL names a viewer**: who you are is world truth
decided server-side (SPEC-028's viewer seam), and a world that states no player
answers 404 rather than pretending.

### Driving the play surface with no backend at all

`scripts/dev/fake-engine.mjs` is a zero-dependency stand-in for the play loop — the
world directory, `scene/current`, both beat endpoints and an image route — emitting
real `world_directory/1`, `scene_current/2` and `beat_frame/2` payloads in the
server's own order. It exists for two reasons: the play surface can be exercised with
no Postgres, no seed, no seats and no image platform at all, and it can produce
contract-legal states the live engine currently **cannot** reach, so the surfaces
that render them stay honest.

```bash
npm run dev:fake-engine                          # :8787
BACKEND_URL=http://localhost:8787 npm run dev    # in another shell
node scripts/dev/fake-engine.mjs --help          # the scenario list
```

Then type a scenario keyword as the beat text: `unresolved`, `unresolved-same`,
`journey`, `arrive`, `interrupt`, `barred`, `bounce`, `telegraph`,
`premise_broken`, `turn_budget`, `gate_reject`, `error` (fails *after* the stream
opens, as a frame), `boom` (fails *before* it opens, as HTTP 500), `slow` (watch
the pending state), `reset`. Anything else is an ordinary completed beat.

It decides nothing about a world and is not a second engine: the frame shapes are
copied from bytes observed on the wire against the real server. The Compendium
reads are deliberately **not** stubbed — they already work against the real
backend with no keys, so a stub would be a second source for data that has a
working one.

For a **deployed** build the FE and backend are separate services, so there is no
proxy. Point the app at the backend with one variable, which is the only place in
the app that names a backend origin (SPEC-020, and the seam that keeps a desktop
wrapper cheap — SPEC-024):

```bash
VITE_API_BASE=https://api.example.com npm run build
```

Unset, it stays empty and every request is a same-origin relative path. The
backend must allow the FE origin (CORS — SPEC-021).

The app boots to the Compendium home (`#/`), which links to each surface.

## Build

```bash
npm run build    # tsc type-check + vite production build → dist/
```

The build does **not** require the backend repo to be present — the generated
types are committed (see below).

## Compendium FE

Read-only presentation over the published Compendium contract. Presentation only
— never world truth (D-7). The FE renders exactly what the API returns and adds no
filtering, sorting, or canon lookups of its own.

### Surfaces (hash routes)

Every world-scoped surface names its world: `#/w/<world-id>/…`. A path that names a
surface without a world (`#/actors`) has no world to resolve and lands on the
picker — the app never guesses which world you meant.

- `#/` — the world picker (`GET /worlds`), the one surface with no world
- `#/w/<id>/` — that world's home
- `#/w/<id>/actors`, `#/w/<id>/locations`, `#/w/<id>/artifacts` — index lists
- `#/w/<id>/actors/:id` and the other two — entity pages
- `#/w/<id>/timeline` — timeline (rendered in the order the API returns)
- `#/w/<id>/play` — the play surface
- `#/_ds`, `#/_scene` — design-system galleries, no world data at all
- Append `?trace=1` to the play page to show the behind-the-curtain reasoning
  trace. It needs **both** keys: the server only sends the trace in debug mode,
  and the client only renders it with this flag — play mode shows the perceived
  world, and authoritative state is debug territory (C-4).

A withheld entity and a genuinely nonexistent one both return 404 and render an
identical not-found state. `perceived_name: null` renders a neutral "Unknown";
null synthesis / last-known fields are shown as absent, never fabricated.

### Scripts
- `npm run dev` — Vite dev server (proxies `/worlds` → `BACKEND_URL`, default `http://localhost:8080`)
- `npm run build` — `tsc && vite build`
- `npm test` — Vitest suite (proves the FE cannot leak)
- `npm run gen:types` — regenerate `src/types/` from `contracts/`
- `npm run verify:types` — fail if `src/types/` drift from `contracts/` (runs in CI)
- `npm run verify:contract` — fail if `contracts/` drift from backend main (needs backend)

### Contract
`contracts/` holds the five published schemas (`actor_page`, `location_page`,
`artifact_page`, `timeline`, `compendium_index`) vendored from
`dreamchat-world-backend` main. They are the source of truth for `src/types/`.
Every payload carries a `schema_version` (D-4). To update: re-copy from backend
main, run `npm run gen:types`, then `npm run verify:contract`. Do **not** hand-edit
the vendored schemas or the generated types.

### PR / merge checklist
- [ ] `npm run verify:types` passes (CI enforces this)
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run verify:contract` passes — **required on every PR and every re-vendor**
