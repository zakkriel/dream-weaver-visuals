# Frontend architecture review — 2026-08-26

**Repo:** `dream-weaver-visuals` (the live DreamChat frontend; `package.json` `name` is
`tanstack_start_ts`, a scaffold default). Branch `feat/consolidate-frontend-knowledge`.
**Seat:** structure — component decomposition, modularity, data flow, state, routing.
Visuals and copy belong to a separate seat and are out of scope except where a structural fact forces
a note.

**Method.** Every finding cites a file and line read on 2026-08-26. Claims of absence name the search
that returned nothing. Read in the mandated order: `AGENTS.md`, `docs/handoff/README.md` §3,
`src/laws/`, `docs/90_archive/design-system/`.

Every citation was then re-resolved against the working tree before this document was filed. 250 of
~270 resolved exactly; the rest are corrected here. Three classes of drift were found and fixed rather
than papered over:

- **The archive moved mid-review.** It was read at `docs/from-archived-frontend/` and is now staged as
  `docs/90_archive/`. Section 5 is re-pointed. That same consolidation deleted three files section 5
  had cited (`skins/base.css`, `skins/fantasy.css`, `skins/moods.css`) and truncated the handover to a
  two-passage excerpt; where evidence is gone, the text now says so instead of citing it.
- **Three rules were attributed to the wrong `AGENTS.md`.** "A guard nobody has watched go red",
  "art is automatic" and the mutation-probe receipts belong to the workspace harness (`../AGENTS.md`),
  not this repo's file. Corrected in place. One further claim — that this repo's `AGENTS.md` still
  names `transcript/1` and `beat_frame/4` — was simply **false**, and F-7 is rewritten accordingly;
  that file had already been fixed on this branch.
- **The repo changed under the review, twice.** Besides the archive move, `vite.config.ts` gained
  `test: { dir: "src" }` at 16:49 while this was being written, which took `bun run test` from red to
  green. A defect measured at 16:42 was therefore already fixed before filing; it is recorded as
  *Resolved mid-review* in §1 rather than as a finding, because reporting a fixed defect as live would
  be the same error in the opposite direction.

**Dispositions.**

| | Meaning |
|---|---|
| **block** | Wrong today. Fix before more work lands on top of it. |
| **gate** | The rule is right and unenforced. Prose loses to green CI; make it a check. |
| **accept-with-reason** | Correct or deliberately acceptable. Recorded so nobody "fixes" it. |

Nothing here is "noted".

---

## Summary

The transport layer is the best-governed code in the repo and should be left alone. The render tree
above it is not: one 722-line component does eight jobs, the same payload is rendered by two
components under two type aliases and two token vocabularies, and the invariant suite that is
supposed to prevent invented content from reaching the screen currently scans **zero files** and
passes vacuously.

18 findings: 9 block, 5 gate, 4 accept-with-reason.

| # | Finding | Disposition |
|---|---|---|
| F-1 | The provenance law scans zero files and passes vacuously | **block** |
| F-2 | Invented content is mounted on the play surface, in a form the law cannot see | **block** |
| F-3 | Four inert nav controls; the rule against them is written in a sibling file | **block** |
| F-4 | `PlayStage` does eight jobs in 722 lines, 30 props, zero tests | **block** |
| F-5 | The presentation layer imports the transport layer; nothing checks direction | **gate** |
| F-6 | One directory entry, two renderings, two type aliases, two token systems | **block** |
| F-7 | The pin table is documented as single and is triple; the documented one is dead | **block** |
| F-8 | TanStack Query is installed, provided, and entirely unused | **gate** |
| F-9 | Presentation lives on both sides of the seam; neither owner can work alone | **block** |
| F-10 | `OrnateFrame` is dead code and its body is copy-pasted three times | **block** |
| F-11 | 37 of 46 vendored primitives are unreachable; a banned library ships | **gate** |
| F-12 | `src/api/` is the correct design | **accept-with-reason** |
| F-13 | `src/api/history.ts` is the model the rest of the repo should follow | **accept-with-reason** |
| F-14 | Testable logic escaped into a route module because there is nowhere else | **gate** |
| F-15 | The route walker silently drops most import forms | **gate** |
| F-16 | Colour decisions sit in engineering-owned TypeScript, unreachable by design | **accept-with-reason** |
| F-17 | `Portrait` stores a fact it should derive; art arriving later never shows | **block** |
| F-18 | Six of nine product surfaces have no route; one is inlined into another | **accept-with-reason** |

---

## 1. The invariant suite

`AGENTS.md` describes `src/laws/` as the mechanism that lets a design tool push to `main` without a
human reading every diff, and specifically as the thing that closed "the data-shaped hole" after the
invented dashboard came back a second time. Three of those claims do not hold.

### F-1 — The provenance law scans zero files and passes vacuously · **block**

The rule: any JSON a route can reach must declare `schema_version` or be an asset descriptor.
Assertion at `src/laws/laws.test.ts:351`, offenders computed `:352-356`.

It collects candidates through `importedJson()` (`src/laws/laws.test.ts:332-340`), which scans only
files in `MOUNTED` (`:334`) for the specifier pattern at `:335`:

```
/from\s+"(@\/[^"]+\.json)"/g
```

`MOUNTED` is the alias-import closure of `src/routes/` (`:57-61`), walked by `reachableFrom`
(`:34-55`), whose resolver is the regex at `:39`:

```
/from\s+"(@\/[^"]+)"/g
```

The chain breaks in two places at once:

1. The only `.json` imports anywhere in `src/` are `src/api/fixture-mode.ts:2-10` (nine
   `@/fixtures/*.json`). Search: `from "[^"]*\.json"` over `src` — those nine lines and nothing else.
2. `fixture-mode.ts` is imported **relatively**, at `src/api/load.ts:29` (`} from "./fixture-mode";`).
   The walker's regex requires a literal `@/` prefix, so `fixture-mode.ts` is never added to
   `MOUNTED`.

Therefore `importedJson()` returns `[]`, and `src/laws/laws.test.ts:351` asserts `[] === []`. The
`src/assets/` exemption at `:353` also matches nothing — `src/assets/` holds seven `.jpg` and no JSON.

The companion staleness test at `src/laws/laws.test.ts:367` has the same problem from the other end:
`PENDING_RULING` is `new Set<string>()` at `:329` — empty — so it asserts `[] === []` too.

Both tests are green. Neither has ever been red. Per the workspace harness's own contract item 4
(`../AGENTS.md:59-62`), a guard nobody has watched go red is not a guard, and this one cannot go red.

### F-2 — Invented content is mounted on the play surface, in a form the law cannot see · **block**

`src/components/dc/playVisualMocks.ts:8-31` exports five hand-authored cards — two under `previous`
(`"A conversation left unfinished"`, `"A path not yet taken"`) and three under `threads`
(`"The unanswered invitation"`, `"The object out of place"`, `"The way beyond this place"`). No
payload carries them; its own header comment (`:1-6`) says so.

They are rendered on the play surface at `src/components/dc/PlayStage.tsx:713` and `:716`, inside the
`Previously` and `Open threads` aux tabs (`PlayStage.tsx:691-700`).

It is imported through the alias — `PlayStage.tsx:6`,
`import { playVisualMocks } from "@/components/dc/playVisualMocks";` — so unlike `fixture-mode.ts` it
**is** in `MOUNTED`. The provenance rule still cannot see it, because `src/laws/laws.test.ts:335`
matches only `.json`. Hand-authored records in a `.ts` module are outside the rule by construction.

This is the invented-dashboard failure recurring in a new file extension. `AGENTS.md` records the
history: the mock came back once already with the content moved from `src/fixtures/` to `src/mocks/`
and every rule passing. The provenance rule was the answer to that. It does not cover this case.

Two structural notes, offered as facts rather than taste, because they bear on whether the module can
stay while a decision is pending:

- `docs/handoff/README.md:147-149` strikes "Open threads" by name as an instance of rule 8
  (`[GA-3]`), noting the founder's own reference contains it and it is struck anyway.
- `PENDING_RULING` (`src/laws/laws.test.ts:329`) is the repo's sanctioned mechanism for a known
  offender awaiting a ruling, and it is empty. If this module is a deliberate hold, that set is where
  it belongs — and per `:367` it only stays legal while it is genuinely imported.

### F-3 — Four inert nav controls; the rule against them is written in a sibling file · **block**

`src/components/dc/PlayStage.tsx:495-498` renders four controls inside the play rail:

```
<Button type="button" variant="ghost" className="dc-rail-item dc-focus"><TimelineGlyph /><span>Timeline</span></Button>
<Button type="button" variant="ghost" className="dc-rail-item dc-focus"><ActorsGlyph /><span>Actors</span></Button>
<Button type="button" variant="ghost" className="dc-rail-item dc-focus"><LocationGlyph /><span>Locations</span></Button>
<Button type="button" variant="ghost" className="dc-rail-item dc-focus"><ArtifactGlyph /><span>Artifacts</span></Button>
```

No `onClick`, no `to`, no handler of any kind. The routes do not exist: `src/routes/` holds six route modules
(`__root.tsx`, `index.tsx`, `worlds.tsx`, `create.tsx`, `w.$worldId.index.tsx`,
`w.$worldId.play.tsx`) and none of them is Timeline, Actors, Locations or Artifacts.

The repo already states the rule, in a sibling component. `src/components/dc/DashboardRail.tsx:8-14`:

> The eight it used to carry — Dashboard, Worlds, Characters, Mods, Discover, Library, Account,
> Settings — were all placeholder links to nowhere. […] Those four return here the day those surfaces
> do; naming them now would be four more dead buttons.

`DashboardRail.tsx:15-22` then ships a three-entry `DESTINATIONS` array containing only routes that
resolve. So the same repo, in two files, both states the invariant and violates it.

The law suite does not catch it because the dead-affordance rule is written as a literal string ban:
`src/laws/laws.test.ts:234` bans `href="#"`. A `<Button>` has no `href`, so four dead controls pass a
suite that would fail one dead anchor.

**Independently found in the same round.** `docs/CONSOLIDATION-2026-08-26.md:313-322` reaches this
finding from the other direction and reads it the same way — the same four controls, the same
`DashboardRail` quotation, the same observation that the `href="#"` rule "slips straight through the
gate that exists for this", and the same conclusion that the suite needs a rule covering handler-less
controls inside a `<nav>`. It marks the disposition **needs a ruling** — wire them when the compendium
surfaces land, or drop them until then. That is a decision, not a discovery, so this review leaves the
disposition at **block** and the choice to the founder.

### F-15 — The route walker silently drops most import forms · **gate**

`AGENTS.md` says the law tests "scan what a route can actually reach" and that the graph is walked
from `src/routes/`. The walker is `src/laws/laws.test.ts:34-55`. It is a regex over source text, not
a resolver, and it follows exactly one specifier form: double-quoted, `@/`-prefixed (`:39`),
resolved against four candidate extensions (`:41-46`) with a silent drop when none exists (`:47-50`).

Forms it does not follow, each occurring in this repo:

| Form | Occurrences |
|---|---|
| Relative `./` and `../` | `src/api/index.ts:1`, `src/api/load.ts:13`, `:20`, `:29`, `src/api/genesis.ts:1`, `src/api/history.ts:1`, `src/routes/__root.tsx:15` |
| Dynamic `import()` | `src/api/auth.ts:78` |
| Single-quoted | `src/routeTree.gen.ts:11-16` |
| CSS with a query suffix | `src/routes/__root.tsx:12` (`../styles.css?url`) |

Consequence: `src/api/fixture-mode.ts` and `src/api/hosted.ts` ship in every build and are scanned by
no static law. Both are reachable at runtime from every surface.

The walker is also structurally odd in one way worth recording: the recursive call at `:48` discards
its return value, so correctness depends entirely on the shared mutable `seen` set (`:34`, `:37`).
It works; it is not obvious that it works.

### Resolved mid-review — the gate was red, and is now green

Not a finding, and deliberately not numbered. It is recorded because §5.1 leans on it and because it is
the clearest instance in this repo's history of the failure mode the whole of §1 is about.

At 16:42 on 2026-08-26 this repo's own gate did not pass. `bun run test` (`vitest run`) reported
`Test Files 20 failed | 5 passed (25)`, exit code 1. Every failing file was under
`docs/90_archive/design-system/`; all five passing files were `src/laws/`. No live source failed. The
cause was scope: commit `dd123b4` landed the archived predecessor's 20 test files inside vitest's
repo-wide default glob, and they cannot run here — they import `@testing-library/react`, which is not a
dependency, and assume a DOM this repo deliberately does not configure (F-4). Confirmed as inherited
rather than introduced by the staged rename: a detached worktree at `dd123b4` reproduced it exactly.

**It was fixed while this review was being written.** `vite.config.ts:49` now sets `test: { dir: "src" }`
inside the wrapper's documented passthrough, and the suite is green — `5 passed (5)`, `140 passed (140)`,
verified at 16:56 both as `bun run test` and as `bunx vitest run`, and the resolved config confirms the
key reaches Vitest. The repo found this independently and wrote it up with the same measurements, at
`docs/CONSOLIDATION-2026-08-26.md:272-302`, including the commit-by-commit table showing `4f83a05` green
and `dd123b4` red.

Two things worth keeping from it. First, `.github/workflows/ci.yml:28` runs `bun run test`, so for every
commit between `dd123b4` and that fix, all five gates this repo relies on were failing on push and PR —
the concrete cost of the gap §1 describes, paid in full. Second, it is the sharpest available argument
for ranked item 1: while the suite was red, the provenance rule going red would have been invisible,
because everything was already red.

### What the suite provably does not check

Searches over `src/laws` returning nothing, or only incidental prose:

| Concern | Result |
|---|---|
| Component size or complexity | No assertion. No test reads a source file's line count. |
| Import direction / layering | No assertion. `grep 'layer\|may not import\|components/dc'` → one prose hit, `src/laws/fixtures.test.ts:8`. |
| Duplicate state | `grep 'useState\|useReducer\|duplicate\|single source of truth'` → no matches. |
| Prop-drilling depth | `grep 'prop\|drill\|Provider'` → no matches. |
| Circular imports | `grep 'circular\|cycle\|madge'` → no matches. |
| Direct `src/api/types/` imports by components | Not checked; `laws.test.ts:30` and `:60` **exclude** that directory from scanning. |

The nearest thing to a computed-value rule is the mutation ban at `src/laws/laws.test.ts:254-263`,
which fires on `.sort(`/`.filter(`/`.reverse(` applied to six named payload fields (pattern
`:257-259`). It catches reordering a payload. It does not catch deriving a new value from one.

**On what the suite gets right, and it is the most important architectural judgement in the repo:**
`src/laws/laws.test.ts:14-15` states that these tests scan rules, not appearance, and the comment at
`:63-72` explains why comments are stripped first. That choice is what makes a design tool pushing to
`main` survivable, and it is the correct call. The suite's problem is coverage and vacuity, never its
premise. See §5 for why the archived design system got this exact question wrong.

---

## 2. Component decomposition

### F-4 — `PlayStage` does eight jobs in 722 lines, 30 props, zero tests · **block**

`src/components/dc/PlayStage.tsx`. Component declared at `:228`, prop interface `:256-287` — 30
props. It is the play surface entire:

| Job | Lines |
|---|---|
| Backdrop, scrim, film grain | `:452-467` |
| Sprite busts: recency sort, top-3 slice, emotion pick | `:291-319`, rendered `:468-482` |
| The nav rail | `:485-500` |
| The header: title, tone, offline note, time chip, three icon buttons | `:502-529` |
| The cast strip with speaking badge | `:536-557` |
| Transcript scroll / follow / prepend-anchor / load-older state machine | `:332-448` |
| Transcript rendering, including per-line variant dispatch | `:600-656` |
| The input dock | `:658-675` |
| The aux sidebar with three tabs | `:680-719` |

Nine, counting the eight named in the summary plus the tab strip. Also inside the same file: eight
inline SVG glyph components (`:148-214`), a `SpriteBust` (`:88-141`), a `Voiced` renderer (`:69-80`),
a `toneChips` splitter (`:143-146`), and `StageIsland` (`:216-226`).

The hardest logic in the repo is the scroll machine. It holds five refs and two state values —
`transcriptRef` `:332`, `atBottomRef` `:333`, `atBottom` `:334`, `selfScrollingUntil` `:343`,
`lastTopRef` `:344`, `fromBottomRef` `:369`, `lineCountRef` `:370` — plus four effects (`:371`,
`:402`, `:415`, and the scroll handler `:426`). Its comments record that the behaviour was established
empirically: `:341`, "Measured at 98px adrift before this existed".

**It has no test, and this repo cannot test it.** `package.json` carries no `@testing-library/*`, no
`jsdom` and no `happy-dom`; no test environment is configured in `vite.config.ts`; and
`grep 'render('` over `src/**/*.test.ts*` returns nothing. Every test in `src/laws/` is either a
static text scan or a pure-function call. The archived design system, by contrast, has 17 files
calling `render()`.

So the most defect-prone code in the repo — hand-tuned, pixel-measured, seven pieces of mutable state
coordinating one scroll position — is the code with no coverage and no means of getting any.

Two further consequences of the size, both structural:

- The component holds two pieces of state its parent also reasons about: `contextExpanded` (`:289`)
  and `contextTab` (`:290`) live here, while `expanded` (`:277`) is lifted to the route
  (`src/routes/w.$worldId.play.tsx:192`). Two adjacent expansion facts, two different owners, no
  stated reason for the split.
- `StageIsland` (`:216`) is exported from this file and consumed by the route
  (`src/routes/w.$worldId.play.tsx:441`, `:464`), so the route imports a layout primitive out of the
  monolith in order to build the `aux` node it then passes back in as a prop (`:439-498`). The data
  flows route → component → route → component.

### F-10 — `OrnateFrame` is dead code and its body is copy-pasted three times · **block**

`src/components/dc/OrnateFrame.tsx` wraps children in `dc-glass dc-frame` plus four gold corner
brackets (`:16-19`). Its doc comment (`:3-6`) calls it "the house frame from the reference".

It is imported nowhere. Search: `grep 'OrnateFrame' src --include=*.tsx` returns only the file's own
declaration.

The four-span block it encapsulates appears verbatim, byte-identical class strings included, in three
files: `src/components/dc/OrnateFrame.tsx:16-19`, `src/components/dc/SideRail.tsx:13-16`, and
`src/components/dc/WorldCard.tsx:55-70`. `SideRail.tsx:11` and `WorldCard.tsx:35` both also apply
`dc-frame` themselves.

The abstraction exists, is correct, and is bypassed by both of its would-be callers.

### F-6 — One directory entry, two renderings, two type aliases, two token systems · **block**

A world in `world_directory/2` is rendered by two independent components:

| | `WorldCard` | `WorldTile` |
|---|---|---|
| Declared | `src/components/dc/WorldCard.tsx:23` | `src/components/dc/DashboardHome.tsx:64` |
| Size | 118 lines | 35 lines |
| Input type | `WorldDirectoryEntry` (`WorldCard.tsx:2`) | `WorldSummary` (`DashboardHome.tsx:7`) |
| Cover policy | `WorldCard.tsx:27-28` | `worldPlate`, `DashboardHome.tsx:32-34` |
| Tokens | `dc-*` | `dashboard-*` |
| Used by | `src/routes/worlds.tsx:87` | `src/routes/index.tsx:58` (via `DashboardHome`) |

The two input types are the same type. `src/types/world_directory.ts:23` defines
`WorldDirectoryEntry = Generated["worlds"][number]`; `src/api/index.ts:19` defines
`WorldSummary = WorldDirectory["worlds"][number]`. Both resolve to the same node of the same generated
schema. Two names, two modules, one type — and `src/types/world_directory.ts:8-10` states the reason
the second module exists: it survives as a re-export so that `components/dc/` keeps importing the path
it always did. That is a compatibility shim inside a repo whose own standing rule is clean cutover.

Both components implement the same cover-image fallback policy independently, and both hardcode the
same string: `"Nobody to be here yet"` appears at `DashboardHome.tsx:93`, `WorldCard.tsx:84`, and a
third time at `src/routes/w.$worldId.index.tsx:163`.

Nothing derives one from the other and nothing tests that they agree. When the directory contract
next changes, two components and one shim have to move together, and the type system will not say so
because both names are structurally identical.

### F-17 — `Portrait` stores a fact it should derive · **block**

`src/components/dc/Portrait.tsx:21-22`:

```
const [broken, setBroken] = useState(false);
const show = src !== undefined && !broken;
```

`broken` is set by `onError` (`:32`) and never reset. It is not keyed on `src`, and there is no effect
clearing it when `src` changes.

This matters because of the product's own art model. `docs/handoff/README.md:156-161` (rule 10,
`[D-8]`) and `src/api/index.ts:39-42` both state that a null or not-yet-generated picture is the
ordinary state and that art arriving later is a payload change the client neither polls for nor
re-requests. The workspace harness adds that art is automatic — genesis kicks a
reconciler and a ticker sweeps (`../AGENTS.md:162`).

So the expected sequence is: a portrait URL fails once while art is still generating, then a later
scene read supplies a working reference. Today the first failure latches, and that mounted `Portrait`
shows the silhouette for the rest of its life even after the image is fetchable. The cast strip
(`PlayStage.tsx:543`) persists across beats, so the window is the whole session.

The fix is one of derivation rather than storage — the same discipline `src/api/history.ts:164-171`
already applies. Recorded as a finding, not a patch.

---

## 3. Data flow and state

### F-12 — `src/api/` is the correct design · **accept-with-reason**

This is the strongest module in the repo and the review's recommendation is to leave it alone.

- **One transport door.** `getJson` (`src/api/index.ts:182-191`) is the single read path; every
  endpoint function delegates to it (`:195`, `:206`, `:214`).
- **Pins by exact string equality, with the rationale written down.** `src/api/index.ts:60-66`
  explains that a family check would let v3 data be read through v4 field access, which is the exact
  failure the pin exists to prevent.
- **A sentinel that refuses to encode a distinction the product forbids.**
  `src/api/index.ts:104` — `NOT_FOUND`, documented as carrying no withheld-vs-nonexistent
  information, which is `[B-1, I-3]` enforced in the type system rather than asked of a reviewer.
- **Loading states as discriminated unions, not booleans.** `DirectoryResult`
  (`src/api/load.ts:44-46`) and `Loaded<T>` (`:48-51`). `unreachable` carries the base it tried, which
  is what makes a typo'd origin distinguishable from a downed backend.
- **Fixture mode as an environment decided once, not a per-request fallback.**
  `src/api/fixture-mode.ts:12-35` reasons the whole thing through: the directory read is the only read
  that can tell "is this world real?" from "is there a backend at all?", so it decides, and the answer
  is sticky.
- **Image URLs built only from the payload's path.** `imageUrl` (`src/api/index.ts:338-344`), with
  `[D-8]` cited at `:39-42`.
- **39 `it` blocks plus three `it.each` tables** in `src/laws/load.test.ts` covering base precedence, fixture stickiness,
  cold-load ordering and the four degradation shapes (`:99-110`).

### F-13 — `src/api/history.ts` is the model the rest of the repo should follow · **accept-with-reason**

It is the one place in the repo where state is a reducer and every question about it is derived:

- `historyReducer` at `:173`, actions typed at `:157-161`, initial state at `:148`.
- `canLoadOlder(state)` at `:164` and `atBeginning(state)` at `:169` are **computed from state**, not
  stored alongside it. Neither can disagree with the data it summarises.
- `toPage` (`:80`) is a pure newest-first → oldest-first transform.
- 32 tests in `src/laws/history.test.ts`, including the cases that matter: a page for a cursor nobody
  awaits is ignored and the state object stays reference-identical (`history.test.ts:148`, `:160-161`).

Contrast with `PlayStage`'s scroll machine (F-4), which answers the same class of question — "is the
reader at the bottom?", "is a page already in flight?" — with seven mutable cells and no tests.
`atBottom`/`atBottomRef` (`PlayStage.tsx:333-334`) is literally the same fact stored twice, once for
rendering and once for synchronous reads.

The route mirrors the ref-beside-state pattern too: `historyRef` (`w.$worldId.play.tsx:193-194`)
shadows `history`, and `inFlightRef` (`:198`) exists because a dispatch does not land before the next
scroll event. Both are justified in comments. Both are the shape that a reducer with derived
predicates already avoids one file away.

### F-8 — TanStack Query is installed, provided, and entirely unused · **gate**

`@tanstack/react-query ^5.101.1` is a dependency (`package.json`). A client is constructed at
`src/router.tsx:6`, threaded into router context at `:10`, and the root route is typed on it at
`src/routes/__root.tsx:77` with a `QueryClientProvider` imported at `:1`.

Nothing consumes it. Search over `src`: `useQuery|useMutation|useSuspenseQuery|queryOptions|loader:`
— **no matches**.

Instead every surface hand-rolls the same idiom. `let live = true` / `let alive = true` appears six
times in five files: `src/routes/index.tsx:31`, `src/routes/worlds.tsx:37`,
`src/routes/w.$worldId.index.tsx:41`, `src/routes/w.$worldId.play.tsx:259` and `:273`,
`src/routes/create.tsx:78`.

Two measurable consequences:

1. **The directory is read three times, unshared.** `loadDirectory()` is called from
   `src/routes/index.tsx:32`, `src/routes/w.$worldId.index.tsx:42` and `src/routes/worlds.tsx:38`.
   Navigating dashboard → picker → world home re-fetches the same payload three times, and
   `w.$worldId.index.tsx:50-51` then does a client-side `.find()` over the whole directory to locate
   one world, because there is no world-summary endpoint (stated at `:30-31`).
2. **No route uses `loader:`.** All data arrives in effects, so on an SSR framework the server renders
   the shell and the meta tags (`__root.tsx:78-110`, and each route's `head:`) and none of the world.

The idiom itself is written correctly every time. The finding is that a caching, deduplicating,
request-cancelling library is mounted and paid for, and six hand-written cancellation flags sit on top
of it.

### F-7 — The pin table is documented as single and is triple; the documented one is dead · **block**

`AGENTS.md` states, in the Data section: "The pin table is the `const PIN` block in `src/api/index.ts`
and nowhere else." and instructs the reader not to restate versions, because this file once listed
three wrong ones.

There are three `PIN` declarations:

| Location | Contents |
|---|---|
| `src/api/index.ts:67-75` | `worlds`, `scene`, `beat`, `transcript`, `carrying`, `refreshed`, `regenerate` |
| `src/api/genesis.ts:43-48` | `artStyles`, `interview`, `kickstart`, `genesisFrame` |
| `src/api/history.ts:91` | `const PIN = "transcript/2";` |

`transcript/2` is pinned twice — `index.ts:71` and `history.ts:91`. Of the two, the one the code uses
is `history.ts:91`, checked inside `fetchHistory` (`history.ts:99-117`). `PIN.transcript` at
`index.ts:71` is read by nothing: `grep 'PIN\.\w+'` over `src/api` returns `worlds`, `scene`,
`carrying`, `refreshed`, `regenerate`, `beat`, `artStyles`, `interview`, `kickstart`, `genesisFrame` —
and no `PIN.transcript`.

So the file `AGENTS.md` names as the single source of truth holds a dead entry for the transcript, and
the live pin is in a file `AGENTS.md` says does not have one. Both currently read `transcript/2`, so
nothing is broken; the next re-pin is where it bites, because a reader following the documentation
would move the dead constant and leave the live one behind.

`AGENTS.md` itself is careful here and must not be "corrected": it declines to restate any version at
all, and the versions it does name — `scene_current/3`, `beat_frame/4`, `transcript/1` — are cited at
`:62-64` explicitly as a past error it already fixed. The defect is the location claim alone. The file
it names as the sole pin site holds the dead transcript entry, while `src/api/index.ts:70-71` pins
`beat_frame/5` and `transcript/2` and `contracts/` holds `transcript.v2.schema.json` and
`beat_frame.v5.schema.json`.

### F-5 — The presentation layer imports the transport layer; nothing checks direction · **gate**

`AGENTS.md`'s seam table assigns `src/components/dc/` and `src/components/ui/` to Lovable, and
`src/api/` to engineering, with the rule that wiring happens by passing typed props into Lovable's
components.

Two of Lovable's components import the transport module directly:

- `src/components/dc/WorldCard.tsx:5` — `import { imageUrl } from "@/api";`
- `src/components/dc/DashboardHome.tsx:7` — `import { imageUrl, type WorldSummary } from "@/api";`

`imageUrl` is a URL builder, not a fetch, so nothing violates the one-writer law. The structural
problem is that the boundary is now crossed by convention only, in files a design tool edits freely,
with no check. Compare `src/routes/w.$worldId.play.tsx:410`, `:415`, which resolves `imageUrl` in the
route and passes strings down — the same job done on the correct side of the seam.

No test constrains this. Search over `src/laws`: `grep 'layer\|may not import\|components/dc'` →
one prose hit at `src/laws/fixtures.test.ts:8`. And `src/laws/laws.test.ts:30` and `:60` *exclude*
`src/api/types` and `src/components/ui` from scanning, so the suite is arranged to see less of the
import graph, not more.

For contrast, and this is the sharpest number in the design-system comparison: across all 89 files of
the archived design system, `grep 'fetch\(|useEffect|from "@/api|from "../../api'` returns **no
matches**. The layer it replaced never touched transport at all.

### F-16 — Colour decisions sit in engineering-owned TypeScript, unreachable by design · **accept-with-reason**

`src/lib/world-theme.ts` derives a per-world accent triplet from `theme.accent`. `worldAccentVars`
(`:46-56`) lightens the accent by `0.28` (`:52`), and picks the on-accent colour by luminance
threshold `0.45`, returning the literals `#12100a` or `#fdf8ec` (`:53`).

This is presentation derived from a payload token, not a world fact invented client-side, so it is
correct with respect to the one-writer law and `world-theme.ts:3-7` states as much. `worldAtmosphereAttrs`
(`:62-67`) correctly passes mood and ornament through as data attributes without printing them.

Recorded as accept-with-reason with one caveat that belongs to structure rather than taste: two colour
literals and two magic constants live in `src/lib/`, which the seam assigns to engineering. The seat
that owns colour cannot reach them, and they are not tokens. The archived design system's equivalent
rule — zero colour literals outside `skins/` — is verifiable there by grep and returns no matches
(§5). Here it is three files away from where a designer works.

---

## 4. The seam, and routing

### F-9 — Presentation lives on both sides of the seam; neither owner can work alone · **block**

The seam is defined by directory: Lovable owns `src/components/dc/` and `src/components/ui/` plus
`src/styles.css`; engineering owns `src/routes/`, `src/api/`, `src/laws/`. Presentation is not
partitioned that way.

Counting `className` attributes containing a layout, spacing, type or colour utility:

| File | Owner per seam | `className` total | Utility-bearing |
|---|---|---|---|
| `src/routes/create.tsx` | engineering | 64 | 60 |
| `src/routes/w.$worldId.index.tsx` | engineering | 30 | 30 |
| `src/routes/__root.tsx` | engineering | 28 | 27 |
| `src/routes/w.$worldId.play.tsx` | engineering | 20 | 19 |
| `src/routes/worlds.tsx` | engineering | 10 | 9 |
| `src/components/dc/PlayStage.tsx` | Lovable | 74 | 4 |

The last row is the pattern that works: `PlayStage` names semantic classes (`dc-island`, `dc-stage-grid`,
`dc-transcript`, `dc-dock`) and the appearance lives in `src/styles.css`, which Lovable owns — 71
`--dc-*` custom properties and 88 `.dc-*` selectors. A restyle of the play surface touches one CSS
file and no TypeScript.

Every other surface does the opposite, in engineering's files. Concrete cost:

- `src/routes/worlds.tsx:30` states "The visuals are entirely `WorldCard` and `SideRail`, which
  Lovable owns. This route decides only what data reaches them." In the same file, `:52` sets the h1
  type scale (`text-[clamp(2.5rem,5vw,4rem)]`, a text-shadow) and `:82` sets the grid template
  (`grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]`). The comment is false about its own file.
- `src/routes/w.$worldId.index.tsx:22-23` says the visuals are placeholder "until Lovable designs this
  surface" — while carrying 30 utility-bearing classNames including a clamp type scale at `:129`.
- The secondary-button class string
  `rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted` appears
  **verbatim 13 times**: `src/routes/w.$worldId.index.tsx` ×7, `src/routes/create.tsx` ×4,
  `src/routes/w.$worldId.play.tsx` ×2. The primary variant `dc-enter` appears 9 times across
  `WorldCard.tsx`, `create.tsx` and `w.$worldId.index.tsx`. `src/components/ui/button.tsx` exists.
- Two token vocabularies coexist with no stated boundary: `dc-*` (used by 13 files) and `dashboard-*`
  (used by `DashboardHome.tsx`, `DashboardPanel.tsx`, `DashboardRail.tsx`, `src/routes/index.tsx`).
  There are 71 `--dc-*` custom properties declared in `src/styles.css` and **zero** `--dashboard-*`
  ones, so the dashboard's utilities resolve through Tailwind config rather than the token contract
  the rest of the app uses.

Net effect: Lovable cannot restyle `/create`, `/w/$worldId` or the login gate without editing files
the seam says are engineering's, and engineering cannot change the dashboard's data shape without
touching files the seam says are Lovable's. The seam is stated by directory and violated by both
parties.

`src/routes/index.tsx` is the counter-example and the template — 59 lines, three states, and a single
`return <DashboardHome worlds={loaded.data.worlds} source={loaded.source} />` at `:58`. That is the
documented pattern, followed once out of five routes.

### F-14 — Testable logic escaped into a route module because there is nowhere else · **gate**

`src/routes/w.$worldId.play.tsx` exports three non-route symbols: `Line` (`:39`), `haltCopy` (`:51`)
and `groupStageLines` (`:124`). `groupStageLines` is the transcript-folding rule — the thing that
must never fuse two actors sharing a perceived label (`[B-1]`, reasoned at `:119-120`).

Both test files import it **from the route**: `src/laws/transcript.test.ts:2` and
`src/laws/history.test.ts:11`. 43 test cases across those two files depend on a route module's
non-route exports.

The logic is pure and well-tested; that is not the finding. The finding is that the repo has no home
for pure view logic — `src/lib/` holds `rp-text.ts`, `world-theme.ts`, `mood-plate.ts`, `utils.ts` and
three error-reporting modules — so the one substantial piece of it ended up in a file whose name encodes a
URL. Renaming the route breaks 43 tests silently, and it is one of 24 hardcoded `src/` paths and
symbol names in the suite.

### F-11 — 37 of 46 vendored primitives are unreachable; a banned library ships · **gate**

`src/components/ui/` holds 46 components. Counting importers across `src`:

| Primitive | Imports | Importer |
|---|---|---|
| `button` | 7 | `PlayStage.tsx`, `DashboardHome.tsx`, and five other unreachable `ui/` files |
| `tooltip`, `toggle`, `skeleton`, `sheet`, `separator`, `label`, `input`, `dialog` | 1 each | only other unused `ui/` files — `sidebar.tsx:9,10,17,18,19`, `command.tsx:9`, `toggle-group.tsx:8`, `form.tsx:14` |
| the remaining 37 | 0 | — |

So the reachable-from-a-route set is **`button`**. `sidebar.tsx` (744 lines) is the sole consumer of
five of the single-import primitives and is itself imported by nothing.

The dependency tail that comes with them: `recharts`, `embla-carousel-react`, `react-day-picker`,
`cmdk`, `vaul`, `input-otp`, `react-hook-form`, `@hookform/resolvers`, `zod`, `sonner`, and 27
`@radix-ui/*` packages.

One of them is explicitly banned from mounted source by this repo's own law.
`src/laws/laws.test.ts:100-101` bans `date-fns` (alongside `toLocaleDateString`, `Intl.DateTimeFormat`
and `formatDistance`) because rule 4 `[B-5]` forbids wall-clock time on screen. `date-fns` is a
declared dependency in `package.json`, and `src/components/ui/calendar.tsx` plus `react-day-picker`
ship a date picker into a product that may never legally render a date. The guard holds today only
because nothing imports them.

### F-18 — Six of nine product surfaces have no route; one is inlined into another · **accept-with-reason**

`docs/handoff/README.md:204-214` enumerates nine surfaces. Routes present:

| # | Surface | Route |
|---|---|---|
| 1 | World picker | `src/routes/worlds.tsx` |
| 2 | World home | `src/routes/w.$worldId.index.tsx` |
| 3 | Play | `src/routes/w.$worldId.play.tsx` |
| 4-8 | Actors index, Actor dossier, Locations, Artifacts, Timeline | none |
| 9 | Aux sidebar + Carrying | no route; rendered inline at `src/routes/w.$worldId.play.tsx:439-498` |

Plus two surfaces the handoff pack does not list, because they postdate it: the dashboard
(`src/routes/index.tsx`) and world creation (`src/routes/create.tsx`).

This is correct and deliberate — `DashboardRail.tsx:8-14` states the governing rule that a destination
appears the day its surface does, and the archived frontend's own handover
(`docs/90_archive/frontend-handover-2026-08-08-excerpt.md:58-78`)
records six acceptance criteria verified unmeetable for want of payload fields — of which the excerpt
now strikes one as stale because that endpoint shipped (`:73`), leaving five, and asks that even those
be read as dated (`:80`). Accept-with-reason.

The one structural note: surface 9's Carrying panel is built inline in the route
(`w.$worldId.play.tsx:463-496`), 34 lines of markup including the stale-decay label logic at `:484-490`.
When Carrying gets its own surface, that logic moves rather than being reused, and there is no
component to move.

Also recorded, since it is load-bearing and easy to break: `/worlds` is simultaneously a route and the
backend's directory endpoint, disambiguated by `Accept` header in the dev proxy bypass at
`vite.config.ts:35-36`. `AGENTS.md` and the config comment (`:24-27`) both record that without it the
proxy shadows the page and the picker serves raw JSON — which it did. Nothing tests it.

### One more, on `create.tsx`

`src/routes/create.tsx` is 701 lines: `CreateWorld` at `:59-556`, `Question` at `:576-676`, and the
`Lane` state machine typed at `:685-701`.

The state machine is genuinely good — a ten-state discriminated union whose comment at `:678-681`
explains why `writing` and `ready` are distinct states rather than one state with a flag, and error
handling that distinguishes three failure classes with different recoveries (`:145-159`: a refused
answer restores the question, a conflict is terminal, a transport failure keeps the world id for
resume).

It is not decomposed at all. Six `useState` calls (`:60-67`), the whole render inline as a chain of
`lane.state === "…"` guards, 60 utility-bearing classNames, and no test — `serializeArtStyle`
(`src/api/genesis.ts:54`) is the only part of creation the suite touches, at
`src/laws/laws.test.ts:379-392`. The `Lane` union is the right idea trapped in a file that also
contains all the markup.

---

## 5. The design-system verdict

**Question asked:** is `docs/90_archive/design-system/` (89 files, of which 54 `.tsx`; unqualified
paths below are relative to that directory) a
better component architecture than this repo has, a worse one, or simply the approach that was
replaced?

**Answer: all three, split by axis. Its component architecture is measurably better than this
repo's. Its testing and enforcement strategy is worse *for this repo's constraint*. And its component
inventory was built for a product surface this repo does not currently ship.** Evidence both ways
follows. Exact-name overlap with `src/components/**` is **0 of 54**; case-insensitive overlap is 3
(`Button`/`Badge`/`Collapsible`), so nothing was ported and the comparison is genuinely
architecture-to-architecture.

### Where it is better, with measurements

**1. A slot shell instead of a monolith.** `primitives/AppShell.tsx` is 77 lines with nine named slots
(destructured `:27-35`, typed `:37-45`: `rail`, `bar`, `scene`, `overlay`, `aux`, `auxMode`, `input`, `backdrop`, `children`), holds
no state, and has exactly one import — `import type { ReactNode } from "react"` (`:1`). Absent slots
render no node (`:57-73`), which its test pins (`primitives/shell.test.tsx:47`).

The comparison to F-4 is direct. This repo's `PlayStage` hardcodes the same six regions and their grid.
The docked ↔ full-screen distinction that `PlayStage` implements with `expanded` (`:277`),
`contextExpanded` (`:289`), a data attribute (`:451`) and conditional classes (`:559`, `:601`) is one
class modifier in `AppShell.tsx:56`, and `shell.test.tsx:58` asserts the aux subtree's `innerHTML` is
byte-identical between the two modes — one render path, proven.

**2. Token indirection that is verifiable, and a swap that costs nothing.** Every token was declared
once under `:root` in `skins/base.css`, and a skin overrode the same names in one scoped block.
**Both CSS files were dropped in the 2026-08-26 consolidation**, so this can no longer be cited line
by line — `styles.css:5-7` still `@import`s them and `skins/fantasy.test.ts:5` still reads one. What
survives: the token contract in the spec
(`docs/90_archive/2026-06-18-design-system-design.md:56-70` — surface, line, text, accent, status,
type family, type scale, space, radius, depth and motion), and
`docs/90_archive/gap-audit-2026-08-09.md:32`, which records that `fantasy.css:2` defined
`[data-skin="fantasy"]` with 23 token overrides.

Two searches, both run:

- `#hex|rgba?\(|hsla?\(` over `primitives/`, `composed/`, `catalog/`, `styles.css`, `reset.css` →
  **no matches**. Every colour literal in the system is inside `skins/`.
- `data-skin|\[data-mood|fantasy` over `primitives/`, `composed/`, `catalog/` → **no matches**. No
  component knows a skin exists.

So a second skin is one CSS file plus one array entry (`skins/index.ts:1`, imported at
`styles.css:5-7`), with no component touched and no React re-render — the gallery switcher already
enumerates the registry rather than hardcoding options (`gallery/Gallery.tsx:38`).

Against this repo: two unrelated token vocabularies with zero `--dashboard-*` custom properties (F-9),
colour literals in `src/lib/world-theme.ts:53` (F-16), and 13 verbatim copies of one button's class
string (F-9).

**3. A layer DAG that holds, including at the data boundary.** Measured import graph:
`gallery → index → composed → {catalog, primitives}`, `catalog → primitives`, `primitives →
primitives`. Verifications run:

- `from "../(composed|catalog|labels|index)"` over `primitives/` → **no matches**. No primitive
  imports upward.
- `fetch\(|useEffect|from "@/api"` over the whole design system → **no matches**. Nothing fetches,
  nothing runs an effect, nothing imports transport.

Routing and image knowledge are pushed to the caller explicitly:
`composed/CarryingOverlay.tsx:10-11` — "routing is app knowledge, so the design system never composes
a URL"; `composed/Dossier.tsx:35-36` — "the caller builds it, so this shell never learns an image path
or a tier". Against F-5, where two Lovable-owned components import `@/api`.

**4. One rendering path per data kind, centralised.** `catalog/epistemic.tsx:30-41` is the single
table turning a kind tag into a label and an icon, with `SourceLine` typed `kind: string` (`:83-91`, the field at `:88`)
and narrowed at runtime by `isEpistemicKind` (`:43`) so an unrecognised value renders **no** label
rather than the raw engine token — pinned by `catalog/catalog.test.tsx:46`. `labels.ts:13-15` states
the same principle for wording: one rule, one wording, two surfaces, because if the participants strip
said "(1 of 2)" while the disambiguation ask said "the first", a reader could not match them up.

Against this repo's three copies of `"Nobody to be here yet"` and three of
`"Could not reach the world service at {base}."` (`src/routes/index.tsx:53`,
`src/routes/w.$worldId.index.tsx:104`, `src/routes/worlds.tsx:70`), with a fourth variant at
`src/routes/w.$worldId.play.tsx:378`.

**5. Components are small and testable, and were tested.** 17 files call `render()`.
`catalog/catalog.test.tsx` is 16 behaviour assertions and no style assertions.
`composed/refactor.test.tsx:14-22` pins that `Timeline` renders records in received order with no
client sort, feeding `Day 2` before `Day 1` deliberately. `composed/composed.test.tsx:71` pins that
same-labelled groups are never merged or reordered — the comment at `:68-70` names the defect it
guards, 25 groups all labelled "Arrival". `primitives/input.test.tsx` is 5 of 5 contract assertions
including that `onChange` receives the value rather than the event (title `:7`, assertion `:14`); two
of the five cover `Collapsible` rather than `InputField`.

Against F-4: this repo has no DOM test environment and zero `render()` calls, so its largest and
most delicate component cannot be tested at all.

### Where it is worse, or where replacing it was right

**1. It was not enforced either — and less so than what replaced it.** The spec names two guards:
scan the CSS for colour literals outside `skins/` (spec `docs/90_archive/2026-06-18-design-system-design.md:153-155`) and assert no `fetch(` anywhere in
the design system (spec `:156-157`). Their implementations lived at `src/test/ds-no-raw-color.test.ts`
and `src/test/no-stray-fetch.test.ts`. **Neither was archived**, and there is no import-boundary test
anywhere in the 89 files — the only tests touching the filesystem are `skins/skins.test.ts:39` and
`skins/fantasy.test.ts:5`, and neither inspects imports.

So the beautiful DAG in §5.3 is *compliance*, not enforcement — exactly the category of claim this
review faults `AGENTS.md` for in F-1. The difference is that `src/laws/laws.test.ts` is a real static
gate, holes and all, and it passes today. On enforcement *in kind*, the live repo is ahead.

One caveat, now historical: until mid-review this archive was itself failing the live suite, having been
committed inside vitest's default glob — 20 failing files, exit code 1. It was scoped out during this
round (`vite.config.ts:49`) and the suite is green again. See *Resolved mid-review* in §1. The archived
system's relocation-broken tests were part of that failure, which is a second-order argument for §5.7:
an unfinished system does not sit inertly in a repo.

**2. Its tests couple to appearance, which is fatal under this repo's constraint.**
`primitives/layout.test.tsx` is 2 of 2 appearance assertions, including
`el.style.gap === "var(--dc-space-5)"` (`:11`). `primitives/typography.test.tsx:10` asserts the classes
`dc-h` and `dc-h--2` alongside the heading role; `:16` asserts `dc-text--muted` and `dc-text--italic`.
`primitives/surface.test.tsx:9` asserts `dc-panel__title`. `skins/fantasy.test.ts:8` asserts the
stylesheet's own source text matches `/\[data-skin="fantasy"\]\s*\{/`.

Those are the tests that turn red when a designer changes a gap token or renames a modifier — no
rule broken, build blocked. This repo's `src/laws/laws.test.ts:14-15` explicitly tests rules and not
appearance, and that is the correct architecture for a repo where a design tool pushes to `main`.
**This single axis is the strongest argument that the replacement was right in kind, not merely in
inventory.**

**3. It drifted from its own specification.** `skins/index.ts:11` ships
`DEFAULT_SKIN: SkinName = "fantasy"`. The surviving specification says `base`, twice —
`docs/90_archive/2026-06-18-design-system-design.md:80-81` and `:158-159` ("an invalid name falls back
to base"). The shipped test at `skins/skins.test.ts:11` asserts `"fantasy"` instead, and an unknown
skin name falls back to the house skin rather than the neutral one (`skins/index.ts:22`, pinned at
`skins.test.ts:22`). The design system's plan document was not archived, so this now rests on one
governing document rather than the two the review originally checked.

**4. Escape hatches in the primitives.** `primitives/Panel.tsx:16` types props as
`… & Record<string, unknown>` and spreads `{...rest}` onto the element (`:19`); `primitives/ImageSlot.tsx:12`
does the same. Arbitrary unchecked props onto a DOM node, in the layer whose whole job is to be the
narrow waist.

**5. Coverage was uneven where it mattered most.** `labels.ts` — the shared-wording seam, the file
whose doc comment argues for its own existence — has no test file. `composed/Dossier.tsx` (74 lines,
the one shell for Actor/Location/Artifact) has no dedicated test. `AppShell`, the widest surface, is
covered by 4 tests.

**6. It solved a different product.** Its `composed/` layer is `Dossier`, `KnowledgeList`, `Timeline`,
`AuxIntent`, `AuxCurrent`, `CarryingOverlay`, `ParticipantStrip`, `JourneyBar`, `SceneCanvas` — the
compendium surfaces. This repo ships routes for none of them (F-18). Of its 13 composed components, the
current product surface needs roughly three. Porting it wholesale would be building the archived
product, not this one.

**7. It was not finished.** Its own handover recorded a known-defective Mara dossier awaiting a backend
ruling (`docs/90_archive/frontend-handover-2026-08-08-excerpt.md:18-55`) and six acceptance criteria
verified unmeetable for want of payload fields (`:58-78`) — of which the excerpt now strikes one as
stale (`:73`) and asks that the remaining five be read as dated (`:80`). Its list of ten deliberately
unbuilt items did not survive the 2026-08-26 consolidation (`:2-4`) and can no longer be checked from
this repo. Two of its tests break on their own hardcoded paths after relocation
(`skins/skins.test.ts:39` reads `index.html`; `skins/fantasy.test.ts:5` reads
`src/ds/skins/fantasy.css` — a file that same consolidation deleted). Its own README is explicit:
"Historical records only. Nothing here is authority, and nothing here is wired into anything."
(`docs/90_archive/README.md:3`), and "Not built, not type-checked, not tested, not in `gen:types`, not
in CI, not imported by any source file." (`:9-10`).

### The verdict, stated plainly

- On **component shape** — slot shell, layer DAG, token indirection, one rendering path per kind,
  small testable units — the archived system is **better than what this repo has, measurably**:
  77-line slot shell vs 722-line monolith; 0 vs 3 copies of one ornament; 0 vs 2 token vocabularies;
  0 vs 2 renderings of a directory entry; 0 vs 2 presentation components importing transport.
- On **enforcement and test strategy**, this repo is **better**, and the archived system's
  appearance-coupled tests would actively harm the Lovable seam. `src/laws/` is the better idea,
  badly bounded (F-1, F-15).
- On **inventory**, it was **simply the approach that was replaced**: built for compendium surfaces
  this product does not ship, against a backend that could not fill them.

The synthesis, and it is the useful answer: take its **shape** and keep this repo's **gate**. A slot
shell, an enforced layer boundary and a single token contract, verified by behaviour-only static laws
that actually scan the mounted tree. Neither half exists today — the shape is absent, and the gate is
vacuous.

---

## 6. Ranked: what I would change first, and why

1. **Make the provenance gate actually run.** Fix the walker (`src/laws/laws.test.ts:34-55`) to follow
   relative and dynamic imports, and extend the provenance rule (`:335`) beyond `.json` to any mounted
   module of hand-authored records. *First because it is the only finding here that is invisible.*
   Every other item can be found by a human reading a file; this one is a green check that has never
   been able to go red, guarding the failure this repo has already suffered twice. Fixing it will
   immediately surface F-2, which is the point.

2. **Remove `playVisualMocks` from the mounted tree, and the four inert rail controls.**
   (`src/components/dc/playVisualMocks.ts`, rendered at `PlayStage.tsx:713`/`:716`;
   `PlayStage.tsx:495-498`.) *Second because these are the live instances of what #1 exists to catch* —
   fixing the gate first without clearing them ships a red build. If either is a deliberate hold,
   `PENDING_RULING` (`src/laws/laws.test.ts:329`) is the mechanism, and it is empty and waiting.

3. **Split `PlayStage`, and install a DOM test environment while doing it.** Extract the
   scroll/anchor machine (`PlayStage.tsx:332-448`) into a hook modelled on `src/api/history.ts` —
   reducer plus derived predicates, replacing `atBottom`/`atBottomRef` with one computed value — and
   extract the shell into a slot component modelled on `primitives/AppShell.tsx`. *Third because it is
   the largest single-file risk in the repo, it has zero tests, and it is untestable until
   `jsdom` + `@testing-library/react` exist.* It is also the file the next five surfaces will be built
   by copying, so every week it stays whole raises the cost of items 4 and 6.

4. **Collapse the duplicate world rendering and the duplicate type alias to one each.**
   `WorldCard` (`WorldCard.tsx:23`) and `WorldTile` (`DashboardHome.tsx:64`); `WorldDirectoryEntry`
   (`src/types/world_directory.ts:23`) and `WorldSummary` (`src/api/index.ts:19`). Delete the shim
   `src/types/world_directory.ts` describes itself as (`:8-10`). *Fourth because the next
   `world_directory` re-pin has to move two components and a shim in lockstep, and the type system
   cannot warn — the two aliases are structurally identical.*

5. **Put the pins in one place.** Either move `transcript/2` into the single block and delete the dead
   `PIN.transcript` (`src/api/index.ts:71`), or delete that entry and document that
   `src/api/history.ts:91` owns its own pin. *Fifth because the state today is the worst of both: the
   location `AGENTS.md` names as canonical holds the dead constant, so a reader who trusts the
   documentation will re-pin the wrong one.* `AGENTS.md` needs no version edit — it already declines to
   restate versions (`:62-64`); only its "and nowhere else" claim has to become true.

6. **Decide the seam by mechanism instead of by directory.** Adopt `PlayStage`'s convention —
   semantic `dc-*` classes in TSX, appearance in `src/styles.css` — across `create.tsx`,
   `w.$worldId.index.tsx`, `worlds.tsx` and `__root.tsx`, and fold the `dashboard-*` vocabulary into
   the `--dc-*` token contract. *Sixth because it is the largest change here and the least urgent
   correctness-wise, but it is the one that decides whether two teams can work in parallel at all.*
   Today Lovable cannot restyle `/create` without editing engineering's files, and 13 verbatim copies
   of one button's classes are the measure of what that costs.

7. **Use the query client or delete it.** (`src/router.tsx:6`, `src/routes/__root.tsx:77`; six
   hand-rolled `let live = true` flags; three unshared `loadDirectory()` calls.) Route `loader:`s would
   also stop the SSR shell rendering empty. *Seventh because the hand-rolled code is written correctly
   every time — this is cost and duplication, not a defect.*

8. **Prune `src/components/ui/` to the reachable set and drop the dependency tail.** 37 of 46 are
   imported by nothing; the reachable set is `button`. *Last because it is pure hygiene* — with one
   exception that raises its priority: `date-fns` is a declared dependency and is explicitly banned
   from mounted source by `src/laws/laws.test.ts:100-101`, and `calendar.tsx` + `react-day-picker`
   ship a date picker into a product forbidden to render a date (`[B-5]`). That guard holds today only
   because nothing imports them.

---

## Appendix — searches run, for reproducibility

| Claim | Search |
|---|---|
| Only `fixture-mode.ts` imports JSON | `from "[^"]*\.json"` over `src` |
| No query usage | `useQuery\|useMutation\|useSuspenseQuery\|queryOptions\|loader:` over `src` |
| `PIN.transcript` unused | `PIN\.\w+` over `src/api` |
| `OrnateFrame` unused | `OrnateFrame` over `src --include=*.tsx` |
| Three ornament copies | `rounded-tl-\[6px\]` etc. over `src --include=*.tsx`, count per file |
| No DOM test env | `testing-library\|jsdom\|happy-dom` over `package.json`; `render(` over `src/**/*.test.ts*` |
| Primitives never import upward | `from "\.\./(composed\|catalog\|labels\|index)"` over archived `primitives/` |
| Design system never fetches | `fetch\(\|useEffect\|from "@/api"` over `docs/90_archive/design-system` |
| No colour literals outside `skins/` | `#[0-9a-fA-F]{3,8}\b\|rgba?\(\|hsla?\(` over archived `primitives composed catalog styles.css reset.css` |
| No component knows a skin | `data-skin\|\[data-mood\|fantasy` over archived `primitives composed catalog` |
| `ui/` reachability | `@/components/ui/[a-z-]+` over `src`, counted |
| Seam className counts | `className="[^"]*(flex\|grid\|mx-auto\|px-\|py-\|gap-\|text-\|border\|rounded\|min-h\|max-w)[^"]*"` per file |
| Token vocabularies | `^\s*--dc-[a-z0-9-]+:` and `^\s*--dashboard-[a-z0-9-]+:` over `src/styles.css` |
| The gate was red, then green | `bun run test` before and after `vite.config.ts:49`; 20 failed / exit 1 → `5 passed (5)`, `140 passed (140)` |
| Red state was inherited, not introduced | `git worktree add --detach /tmp/x dd123b4 && bun run test` — identical to the working tree |
| The fix reaches Vitest | resolved `vite.config.ts` export carries `test: {"dir":"src"}` at top level; `bunx vitest run` and `bun run test` agree |
| F-1 is vacuous, not merely narrow | re-implemented `reachableFrom` + `importedJson` verbatim outside the repo: `MOUNTED` is 25 files, `importedJson()` returns `[]`, `fixture-mode.ts` and `hosted.ts` absent, `playVisualMocks.ts` present |
| Archive counts | 89 files / 54 `.tsx` / 13 `composed/` components / 17 files calling `render()` |

**On the numbers that moved.** Re-counting changed five: the archived design system is **89** files, not
91 (three `skins/*.css` deleted in the consolidation, one `DECISION-PENDING.md` added — `docs/90_archive/README.md`
independently says 88); `composed/` holds **13** components, not 19 (19 `.tsx` files, six of them tests);
`sidebar.tsx` is **744** lines, not 662, and is the sole consumer of **five** single-import primitives,
not four; `src/laws/load.test.ts` has **39** `it` blocks plus three `it.each` tables, not 41; and
`dc-*` classes appear in **13** files, not 11. Every measurement in the F-9 className table reproduced
exactly, as did 722 lines for `PlayStage.tsx`, 701 for `create.tsx`, 46 `ui/` components with 37
unimported, 71 `--dc-*` properties against zero `--dashboard-*`, the 13 verbatim button-class copies,
and all six `let live = true` sites. No finding changed because of any of these.
