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

- **Pins are exact.** `src/api/index.ts` pins `world_directory/2`, `scene_current/3`, `beat_frame/4`,
  `carrying/1` and `transcript/1` by string equality. A mismatch fails the load rather than reading a
  v4 payload through v3 field access. When the backend supersedes a version it DELETES the old
  schema, so a re-pin is a re-vendor: copy, `bun run gen:types`, move the pin, re-capture the
  fixtures that carried the old version — a stale capture fails `src/laws/fixtures.test.ts` on purpose.
- **Types are generated.** `src/api/types/` is codegen from `contracts/`. **Never hand-edit it** —
  `bun run verify:types` diffs it byte-for-byte. Regenerate with `bun run gen:types`.
- **Schemas are vendored.** `contracts/` holds copies of the backend's schemas; `bun run
  verify:contract` fails if they drift from backend `main`. It is scoped to the contracts the built
  surfaces consume — add a file the same commit a surface starts reading it.
- **Offline falls back to fixtures.** `src/api/load.ts` returns a bundled capture when the backend is
  unreachable, and the surface says so. It deliberately does **not** fall back on 404 (a missing world
  must read as missing) or on a schema mismatch (that is the breakage the pin exists to surface).

### Where the backend is — four rungs, highest first

| # | Condition | Base | Notes |
|---|---|---|---|
| 1 | `VITE_API_BASE` is set | that origin | explicit override; wins everywhere |
| 2 | **a hosted hostname** (anything that is not your own machine) | `HOSTED_API_BASE` in `src/api/hosted.ts` | **committed on purpose** — see below |
| 3 | localhost | `""` (relative) | the vite dev proxy; same-origin, no CORS |
| 4 | localhost and nothing answers | — | fixture mode, bundled captures |

**Rung 2 is committed, not configured, and that is the whole point.** Lovable builds this repo
**without injecting custom `VITE_*` variables**, so an env var there is an env var that does not
exist — which is why the preview sat in fixture mode showing captured worlds. The URL is public (the
browser sends it on every request), so there is nothing to protect by hiding it.

**To repoint the hosted preview, edit one line in `src/api/hosted.ts`.** No env plumbing.

The "hosted" test is deliberately broad — *not* an allowlist of `*.lovable.app` /
`*.lovableproject.com` — because preview domains change and the failure mode of a missing pattern is
the exact silent fixture-mode fallback this exists to end. A wrong guess is loud: the app names the
base it could not reach. A missing pattern is silent. Note the consequence: `bun run dev --host`
reached over a LAN IP counts as hosted and will use the committed base, not your proxy.

```bash
bun run dev --port 5273 --strictPort                        # backend expected on :8080 via the proxy
BACKEND_URL=http://localhost:9000 bun run dev --port 5273   # retarget the PROXY (local)
VITE_API_BASE=https://staging.example.com bun run dev       # override everything
```

`BACKEND_URL` and `VITE_API_BASE` are different tools: the first retargets the dev proxy, the second
bypasses the proxy entirely. See `.env.example`.

**A resolved base takes fixture mode off the table.** Rungs 1 and 2 are statements that a backend
exists at that address, so if it cannot be reached the app says `Could not reach the world service at
<base>` and names it — a typo'd URL looks exactly like a backend that is down until you can see which
origin was tried. Quietly serving stale captures would hide a broken deployment behind a screen that
looks like it works.

**Cross-origin caveat for rungs 1-2:** the backend must allow that origin, including `POST` with
`Content-Type: application/json`, which preflights. Image fetches go to `{base}{path}` and follow a
302 to the asset host, so that host must be reachable from the browser too.

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

**The data-shaped hole, and how it is closed.** The law tests are static: they catch a violation
written in code — a dead link, a banned word in JSX, a tick interpolation — and they cannot read the
meaning of a value that arrives as *data*. That gap was not theoretical. The invented dashboard came
back with the same fabricated content moved from `src/fixtures/` to `src/mocks/` and the `href="#"`
placeholders removed, and every rule passed.

So there is now a rule about **provenance** rather than wording: any JSON a route can reach must
either declare a `schema_version` — making it a captured payload traceable to a contract — or be an
asset descriptor under `src/assets/`. Anything else is somebody's imagination typed into a file, and
once it is mounted a reader cannot tell it from the world.

Known offenders pending a decision sit in one explicit `PENDING_RULING` list with a reason. A second
test fails if an entry outlives the import it excuses, so an exemption cannot quietly become
permanent.

---

## The transcript

**Behaviour is ours; sizing and styling are Lovable's.**

The engine streams narration a line at a time, so the transcript follows the newest line as a beat
arrives — but only when the reader is already at the bottom. Someone who has scrolled up is reading
back, and yanking them to the newest line mid-sentence is worse than not following at all. The scroll
respects `prefers-reduced-motion`.

**`.dc-transcript`'s height, and every other visual property of the dialogue card, belong to Lovable.**
The panel is currently a bounded scroll region; whether it stays that height, grows, or becomes
something else is a design decision and we do not touch it. If a behaviour we own stops working at
some size, we say so rather than resizing it.

Every line the engine sends is rendered, in arrival order, and consecutive lines from the same
speaker share one portrait and one name. Grouping is on `speaker_id` and never on the label: two
actors can carry the identical perceived label on purpose, and grouping by label would fuse two
people into one on screen (B-1).

### The record

The transcript is not just this session. On load the surface reads the world's stored history —
everything said and generated here before — and renders it **above** the live lines in the same card,
with nothing between them. To the player there is no seam: it is one story, and only one end of it
happens to be arriving now.

**Behaviour is ours.** Reading the record, paging it, keeping the reader's place, following the
newest line. **The look is Lovable's**, including two classes we added as behavioural minimums
because the mode cannot exist without them:

| Class | What it is for | What we ask for |
|---|---|---|
| `.dc-transcript-expanded` | The card grown into the full-history view. Currently `max-height: min(62vh, 620px)` | A real expanded treatment — full-height or overlay, your call. The behaviour does not care how tall it is |
| `.dc-action-body` | Staging: italic prose beside the name, never quoted | The italic voice for actions, distinct from `.dc-speech-body` but clearly the same character |
| `.dc-transcript-bar` / `-toggle` / `-now` / `-status` | The expand control, jump-to-now, and the record's status | A designed control row. It is a bordered pill today because that is the house shape |

Three things the behaviour depends on, which a restyle must not break:

1. **The scroller is one element** (`.dc-transcript`). History and live share it; splitting them into
   two scroll regions breaks continuity and every scroll rule below.
2. **The record's status lives OUTSIDE the scroller**, on the bar. Inside, it prepends and removes a
   line at the exact moment an older page lands and shifts the text the reader is looking at by its
   own height. That was measured, not guessed.
3. **Older pages are prepended**, so the reader's position is restored by distance from the BOTTOM.
   Anything that changes the scroller's padding or inserts content above the lines must keep that
   distance meaningful.

### The asterisk convention

The player writes staging with asterisks — `*steps back into the smoke*` — and the transcript reads
it as an action. **Display only.** `src/lib/rp-text.ts` splits a line for rendering; what is sent to
the world and what is stored keep every character as typed, asterisks included. The engine
interprets the raw text, so a client that stripped punctuation on the way out would be editing the
player's intent. There is a test that the parts sum back to the original.

### Prose and speech are separate fields

`beat_frame/4` and `transcript/1` carry a narration segment as
`{speaker_id, speaker_label, kind, text, quote}` — byte-identical in both, on purpose, so history and
live render through one path. `Voiced` in `PlayStage` is that path.

- **`quote`** is the verbatim spoken words, **without** quotation marks. The marks are ours.
- **`text`** is prose: the whole segment for `narration` and `action`; for `speech` it is only the
  STAGING around the line — *"she leans in, her voice dropping"* — and is **legitimately empty** when
  a line is delivered bare.

**Never render `text` unconditionally.** Roughly half of live speech arrives bare, and an
unconditional paragraph puts an empty line above every one of them. There is a test for it and a
browser check that counts blank paragraphs on screen.

### The record

`transcript/1` at `GET /worlds/{w}/transcript`, viewer-scoped, newest first, `?before=<entry_no>`
paginated until `next_before` is null. Read it through `loadHistory` in `src/api/load.ts`, never
`fetchHistory` directly, so fixture mode is respected.

One entry is a **beat**, not a line: `stated` (the player's raw input, null for a Continue press —
a different fact from an empty string), then `segments` in delivered order, then the halt if there
was one. `entry_no` is the ordering handle and the cursor; a `tick` cannot order, because several
entries share one.

Two rules that are not ours to relax:

1. **Stored labels are frozen at delivery and the backend pins that with its own tests.** An entry
   written before the viewer learned a name still says *"the muscle by the bar"* after he learns
   *"Jonas"*, because a memory of an experience is itself a perception (D-7). This client renders the
   record and never re-resolves a remembered line against the present cast. It is not a bug. Do not
   "fix" it.
2. **A remembered line wears no portrait.** `transcript/1` stores no picture per entry, so the
   silhouette is the honest likeness of a memory (D-8). Borrowing today's portrait would leak an
   identity backwards through the viewer's own record (B-1).

A live history read that fails **never** falls back to the bundled capture. For a scene a stale
capture is an old view of a place that still exists; for a story it is a different story, shown to a
reader as their own memory.

## The dashboard

**It is Lovable's screen, on the backend's data.** The founder ruled that it stays; the law decides
what may appear on it. Those two are compatible, and the split is: **Lovable owns how it looks, the
payload owns what it says.**

Every string, picture and link on `/` now comes from `world_directory/2` or is chrome we wrote. If a
panel wants a field the directory does not carry, the panel does not ship — it waits for the field.
The panels removed when it was wired, each with the reason:

| Removed | Why |
|---|---|
| "Welcome back, Aria", the profile chip, the presence dot | There is no session model. The product does not know who you are, and a green dot claims a liveness nothing measures (rules 12–13) |
| Account panel: plan, "Renews on May 26, 2025", Billing/Subscription links | A wall-clock date on screen (B-5), plus billing for an account that does not exist |
| Characters panel (names, roles, online dots) | No actor payload is wired, and *Characters* is not the word — the Glossary says **Actors** (F-1). Its dots also claimed presence (rule 12) |
| Mods panel | No module manifest is wired; module UI renders from manifests into named slots, never hardcoded (D-2) |
| Updates panel, incl. "Character relationship tools" | Invented release notes, and relationship UI of any kind is banned outright (B-3) |
| Discover panel | An invented catalogue of worlds nobody has |
| "Create New World" / "Import Seed" / the "+ New World" tile | Creation is not on this surface |
| "Last Played" hero, "Act I · Chapter 4", "Day 3 — Morning" | A recency claim and a progress claim with no payload behind them |
| Rail: Characters, Mods, Discover, Library, Account, Settings | Six links to nowhere, one of them forbidden vocabulary (F-1) |

Substituted rather than deleted, where a legal analog existed: the hero eyebrow is now the world's own
`last_place_label`; the hero body is its `tagline`; sprite crops became real `cover_image` covers with
the mood plate as the fallback; the section's dead "View all" button became a real link to the picker.

The picker keeps its own route at `/worlds`, reachable from the rail and from the worlds panel.

### `/worlds` is two things

It is the directory endpoint *and* the picker's route. The dev proxy tells them apart by `Accept`:
a browser navigating sends `text/html` and is bypassed to the app; a `fetch` is forwarded to the
backend. Without that the proxy shadows the page and the picker serves raw JSON — it did.

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
