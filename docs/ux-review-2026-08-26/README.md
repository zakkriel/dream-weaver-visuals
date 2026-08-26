# UX & experience review — `dream-weaver-visuals`, 2026-08-26

Reviewer seat: UX and experience. Branch `feat/consolidate-frontend-knowledge`. Reviewed against
`dreamchat-world-backend/docs/20_design_ux/core_ux_loop_and_aux_sidebar.md` (the authority), the
Compendium PRDs, `docs/handoff/README.md` §3 (the thirteen rules), and the mockups in
`dreamchat-world-backend/docs/20_design_ux/mockups/`.

No product code was changed. Screenshots are in `./screenshots/`.

---

## 1. Did I get it running — and what that lets me judge

**Yes, partly. Read this section before any finding below, because it removes about half of what a
UX review would normally say.**

`./stack.sh start` brought up all four pieces and `./stack.sh status` was green:

```
ok   image platform :8081 /health
ok   world postgres :5432
ok   world backend  :8080 /worlds
ok   frontend       :5273
```

The local backend served a real directory of 11 worlds. I created a world end to end from a
652-character prose brief, answered two interview questions and both kickstart turns, walked in, and
submitted a beat. Everything in §3 that is marked *observed* was seen in a browser at 1600×1000.

### Limit 1 — every backend seat was a fake dev stub

`.stack/world-backend.log`, first line after boot:

```
seats: cognition_batch=fake-cognition:dev(unrouted) cognition_isolated=fake-cognition:dev(unrouted)
decompose=fake-intent:dev(unrouted) narrate=fake-narrate:dev(unrouted)
place_author=fake-place-author:dev(unrouted) resolve=fake-resolve:dev(unrouted)
world_actor=fake-world-actor:dev(unrouted) world_genesis=fake-world-genesis:dev(unrouted)
world_interview=fake-world-interview:dev(unrouted) world_kickstart=fake-world-kickstart:dev(unrouted)
```

Every seat timing line reads `tok_in=0 tok_out=0 cost_usd=0.000000`. `stack.sh:238` says it outright:
":5273, free fake narrator".

**So no world content I saw was authored by a model.** The world name
`A World From: a nightshift ferry terminal` is `fake-world-genesis` concatenating my own first words;
the tagline `Somewhere someone owes something, and the ledger is open.` is *identical on all 11
worlds*; the narration line `Scene: I stepped in off the street.` is literally
`core/api/bridge_fakes.go:70` doing `out := "Scene:"` and appending the scene lines; `decompose`
returned `chars=2`.

**Therefore I do not judge, and this review makes no claim about:** narration prose quality, world
naming, tagline quality, interview question quality, whether the beat rhythm of §3.1 ("around 1–6
visible messages") holds, or whether cause would be legible if a real `decompose` seat were routed.
Anywhere content quality would have been the finding, I say so instead of scoring the stub.

What *is* fully judgeable and is what this review is about: layout, hierarchy, typography, spacing,
affordances, state coverage, information architecture, which data paths exist, and law compliance.
Those are seat-independent.

### Limit 2 — the real-narrator path was down

`./stack.sh play` points the UI at the Railway backend on `:5280` for real seats. That backend is
**down**:

```
GET https://world-api-production-8fa6.up.railway.app/worlds
502  {"status":"error","code":502,"message":"Application failed to respond"}
GET .../health → 502
```

Both calls also took 15–47s to fail. So I could not review the product with real seats at all, and
I did not fake having done so. I also did not get to capture the resulting frontend error state on
`:5280` — with `VITE_API_BASE` set, the four-rung rule says fixture mode is off the table and the app
should name the base it could not reach. **That path is untested in this review.**

### Limit 3 — no generated art existed

`./stack.sh start` reported `image generation failed` / `portrait generation reported failures`, and
every world's `cover_image` was null except one, whose asset 404s. So every observation about art is
an observation of the **no-art fallback path**. The sprite-bust layer (`PlayStage.tsx:468-479`, which
needs all four of `neutral/happy/angry/sad`) never appeared and is unreviewed.

### Limit 4 — the handoff screenshots are not this app

`docs/handoff/surfaces/screenshots/01-picker.png` … `10-play-mist-world.png` were captured
**2026-08-09 against `dreamchat-frontend`**, the archived predecessor (`docs/handoff/README.md:3-6`).
They show Compendium routes that do not exist here, rainbow-mosaic broken portraits that the live
`Portrait` component does not produce, and a bulleted-link dashboard that has been rebuilt. I used
them only as prior art. Anyone reviewing from them will report several defects that are already gone.

---

## 2. What I judged it against

A person writes a few hundred words of prose; the system invents a world; the person plays a
character *inside* it. Three differentiators, each of which must be visible or the product does not
exist: **known world, not omniscient** (canon and perception are different data — `B-1`, `C-4`,
`D-7`); **memory matters** (what was learned, when, from whom, whether it decayed); **names are
earned** (a descriptor until the fiction gives the name).

Target feel: **JRPG crossed with a companion game.** Not a dashboard, not a chat app, not an admin
panel. Where a screen reads as a form I name the screen.

---

## 3. Findings

### BLOCK

---

#### BLOCK-1 — Two of the three aux-sidebar tabs tell the player things about their world that the world never said

**Screen** `/w/:worldId/play`, the Aux Context Sidebar.
**Component** `src/components/dc/PlayStage.tsx:712-717`, data `src/components/dc/playVisualMocks.ts:7-31`.
**Evidence** `screenshots/15-aux-previously.png`, `screenshots/16-aux-threads.png`.

The `Previously` tab renders *"A conversation left unfinished — The last exchange still hangs over the
room."* and *"A path not yet taken — Another direction remains open to you."* The `Open threads` tab
renders *"The unanswered invitation — Someone is waiting for your response."*, *"The object out of
place — A small detail asks for a closer look."*, *"The way beyond this place — There is more to
discover when you move on."*

These are hardcoded strings in a `.ts` module. I confirmed them **live**, in a world created ninety
seconds earlier, containing one actor, in which the player had taken zero actions. There was no
invitation, no object, and no way beyond. The cards are styled identically to the real `Current`
island beside them, in the world's own voice, and a reader cannot tell them apart. They will read the
same in every world, forever.

**Against:**
- `B-1` — nothing enters the player's knowledge field except by a valid in-world path. This entered by
  none.
- Spec §2.4, first lines of the Aux Sidebar section: *"It is not a memory log. It is not a quest
  tracker. It is not an omniscient world-state panel."* `Open threads` is a quest tracker.
- Spec §2.4 AUX Interaction Rule 6, *Knowledge boundary enforcement*: *"The AUX must never reveal
  hidden truth by default. If information is not knowable from the user-controlled perspective, it
  should not appear in Current, Inspect, Intent, or Known."*
- Handoff rule 2 (`D-7`) *"Never invent a field the payload does not carry"* and rule 3 (`B-1`, `I-3`,
  `D-7`) *"Never show anything not in the payload for the current viewer."*

**Why it is live despite a law test.** The provenance law (`src/laws/laws.test.ts:304-370`) requires
every JSON file a route can reach to declare a `schema_version`. `playVisualMocks.ts` is a TypeScript
module, so the law does not see it. This repo's own `AGENTS.md` records the previous instance of this
failure — invented dashboard content moving from `src/fixtures/` to `src/mocks/` to evade the check.
It has recurred one file extension over.

---

#### BLOCK-2 — Two of the product's three differentiators have no data path into the interface

**Screens** all of them. **Components** the absent ones.
**Evidence** `screenshots/11-play-arrival.png`, `screenshots/17-play-rail-dead.png`, plus the contract
inventory below.

There is no Actor dossier, no Location dossier, no Artifact dossier and no Timeline in the live
frontend. `src/routes/` holds exactly six files: `__root`, `index`, `worlds`, `create`,
`w.$worldId.index`, `w.$worldId.play`.

The backend publishes 28 schemas; `contracts/` vendors 12. The five that carry the epistemic
vocabulary are **all unvendored, untyped, unfetched and unrouted**: `actor_page/2`, `location_page/1`,
`artifact_page/1`, `timeline/1`, `compendium_index/1`. So `epistemic_type`, `confidence`, `source`,
`perceived_name`, `perceived_role`, `last_known_status`, `current_synthesis` and
`collected_knowledge_groups` reach no screen. The canonical ten-value enum
(`direct · shared · told · overheard · public · rumor · inference · mistaken · confirmed · disputed`,
`docs/10_prds/compendium/01_epistemic_type_canonical_enum.md`) is unreachable in its entirety.

The **complete** epistemic vocabulary of the running app is four things:

| Signal | Site |
|---|---|
| `carrying/1` `decay.stale` + `decay.last_confirmed_label` → *"last known — not confirmed since {label}"* | `src/routes/w.$worldId.play.tsx:484-489` |
| `carrying/1` `quick_inspect_preview` | `src/routes/w.$worldId.play.tsx:479-481` |
| `transcript/2` `speaker_label`, frozen at delivery | `src/components/dc/PlayStage.tsx:632` |
| the derived `remembered` seam — a memory never folds into a live run and wears a silhouette | `src/routes/w.$worldId.play.tsx:144, :164` |

**A player cannot ask "what do I know about her, and how do I know it" anywhere in this app.**

**Against:** spec §2.4 Lens 4 `Known` and MVP Feature Set items 1, 7 and 8; spec §2.6 *"Play mode
shows the known/perceived world"*; `prd_timeline_and_perception.md` AC1–7;
`prd_compendium_actors.md` AC1–10. The mockups that draw what is missing are
`mock_aux_lens_known_actor.png` (the `KNOWN` / `LAST-KNOWN` / `UNCERTAIN` / `INFERRED` bands),
`mock_compendium_actor_seren_v2.png` and `mock_compendium_timeline.png`.

**Not a mystery of missing data.** `src/fixtures/` already holds seven captured compendium payloads —
`actor_page_mara.json`, `actor_page_viewer.json`, `location_page.json`, `timeline.json`,
`index_actors.json`, `index_locations.json`, `index_artifacts.json` — and **no TypeScript file imports
any of them**. `timeline.json` alone carries 59 records with real `epistemic_type` values (`told`,
`direct`), `confidence` and `decay`. The data exists, is well shaped, and is captured. The surfaces
were not built here.

**Two backend facts that keep this honest.** `confidence` is never written (always `1.0`), and
`disputed` / `mistaken` / `confirmed` are never produced by any code path
(`docs/30_architecture/world_model/01_engine_capability_audit.md:50,52,54`). And the compendium page
projections hardcode `decay.stale = false` (`20260615090001_compendium_read_functions.sql:70,181,207`)
while `fn_compendium_decay` sits defined and unused. So a review demanding a "disputed" treatment is
demanding something the engine cannot produce, and dossier decay would read never-stale even the day
these schemas are vendored. The frontend gap is real; it is not the whole gap.

---

#### BLOCK-3 — A broken-image glyph on the product's front door

**Screens** `/` (dashboard) and `/worlds` (picker).
**Components** `src/components/dc/DashboardHome.tsx:32-34` (`worldPlate`) and
`src/components/dc/WorldCard.tsx:28-29`.
**Evidence** `screenshots/02a-broken-cover-detail.png` (detail), visible bottom-centre of
`screenshots/01-first-contact.png`.

The Drowned Lantern is the only world carrying a real `cover_image`. That asset is dangling:

```
GET /worlds/2222…2222/images/asset_1396dfe35795edd0?tier=preview → 404
```

In the browser the `<img>` reports `naturalWidth 0x0, complete true` and the tile renders the
browser's default broken-image icon in the top-left of an otherwise empty card, with the world's name
beneath it. Ten worlds show a bundled mood plate; the one world with real art shows a broken picture.

**Against handoff rule 10 (`D-8`), verbatim:** *"Pictures: silhouette on null, and never re-fetch on a
text change"* — *"absent portrait is ordinary; no spinner, no broken-image, no no-image message, no
reserved hole."*

Both call sites choose `cover_image` when it is non-null and have **no `onError`**. The correct
pattern is already in this repo, eleven lines away in spirit: `src/components/dc/Portrait.tsx:31`
does `onError={() => setBroken(true)}` and falls back to a drawn silhouette. A 404 cover must fall
back to the mood plate exactly as a null cover does. The dangling asset is a backend problem; a
broken glyph on screen instead of the fallback that already exists is this repo's.

---

### GATE

---

#### GATE-1 — Four dead buttons in the play rail

**Screen** `/w/:worldId/play`, left rail. **Component** `src/components/dc/PlayStage.tsx:495-498`.
**Evidence** `screenshots/17-play-rail-dead.png` — the state *after* clicking all four. The finding
rests primarily on a DOM and interaction test, which is stronger than the image: I read each element
and clicked each one.

```
Timeline    BUTTON  href=null  onclick=false  disabled=false  → URL unchanged
Actors      BUTTON  href=null  onclick=false  disabled=false  → URL unchanged
Locations   BUTTON  href=null  onclick=false  disabled=false  → URL unchanged
Artifacts   BUTTON  href=null  onclick=false  disabled=false  → URL unchanged
```

Focusable, enabled, styled as navigation, inert. They are the only visible route to the four surfaces
BLOCK-2 is about, so the player is invited four times into the missing half of the product.

**Against handoff rule 13 (`D-14`)** *"Do not add navigation to surfaces that do not exist."*

Sharpened by the repo contradicting itself twice: `src/components/dc/DashboardRail.tsx:5-14` says
naming those four "would be four more dead buttons" and omits them, and
`src/routes/w.$worldId.index.tsx:258-260` says they are *"deliberately absent until those surfaces
exist. A nav item that goes nowhere is a promise the product cannot keep, and a law test asserts
there are no placeholder links."* That law test (`src/laws/laws.test.ts:236-241`) greps for the
literal string `href="#"`, so a `<Button>` with no handler walks straight through it. **Second law-test
hole, same shape as BLOCK-1: the guard checks a spelling, not a behaviour.**

---

#### GATE-2 — One of the four specified aux lenses ships, and the missing one is the answer to "is cause legible"

**Screen** `/w/:worldId/play`, Aux Context Sidebar. **Component** `PlayStage.tsx:680-718`.
**Evidence** `screenshots/14-aux-current.png`, `15-aux-previously.png`, `16-aux-threads.png`,
`12-play-after-beat.png`.

Spec §2.4 MVP Feature Set item 1 requires four lenses — `Current`, `Inspect`, `Intent`, `Known` — and
items 5, 6 and 7 require the last three by name. All four mockups
(`mock_aux_lens_current/inspect_artifact/intent/known_actor.png`) draw the same four-word tab strip.

The app ships `Current` (real data), plus `Previously` and `Open threads` (invented — BLOCK-1). The
strings `lens`, `Inspect`, `Intent` and `Known` do not occur anywhere in `src/`.

`Intent` is the one that matters most here. Spec §2.4 Lens 3: *"How did the system understand what I
am trying to do?"*, and §4.6 makes the correction window depend on it. **Cause is not legible in this
app.** In `12-play-after-beat.png` I asked *"I ask her whose name is at the top of the open page."* and
received *"shifts their weight and watches you, saying nothing."* — a refusal to answer with nothing
anywhere on screen indicating whether the question was understood, whether she does not know, whether
she declined, or whether the engine dropped it. `mock_aux_lens_intent.png` draws exactly the surface
that would have said so.

**The data is already arriving and being discarded.** `beat_frame/5` carries an `interpretation` frame
(`chain: attempt[]`) and a `trace` frame (`reasoning_log: beat_trace`), both typed at
`src/api/types/beat_frame.ts:172-176` and `:302-306`, with no render site. *(With fake seats routed
`decompose` returned 2 characters, so I cannot say what a real chain would look like — only that
nothing renders it.)*

One correction to the mockup: its `Interpretation confidence — High (82%)` is struck by handoff rule 2,
because `confidence` is never written backend-side. The lens is required; the percentage is not.

---

#### GATE-3 — The creation brief is a 38-pixel two-line window

**Screen** `/create`. **Component** `src/routes/create.tsx:285`, cause `src/styles.css:610`.
**Evidence** `screenshots/04-create-empty.png`, `screenshots/05-create-brief.png`.

This is the most damaging craft defect I found, and the answer to "where does creation lose the
person".

The surface asks, in its own words: *"Describe somewhere you want to walk into. A sentence is enough;
three paragraphs is better."* I typed 652 characters — three paragraphs, exactly what was asked. Measured
in the browser:

```
#brief   rows="6"   height 38px   min-height 38px   max-height 38px
         scrollHeight 108px   clientHeight 38px
         border 0px none   background rgba(0,0,0,0)   box-shadow none
```

The content needs 108px and gets 38px. In `05-create-brief.png` you can read the consequence
directly: the field displays two lines beginning **mid-sentence** — *"plastic seats, and a man in a wet
coat who arrived without luggage and has not sat down once…"* — with the opening of the person's own
paragraph clipped away above the visible area and a sliver of a cut-off line at the top edge. The
writer cannot see, re-read or edit what they wrote.

Unfocused, it has no border and no fill, so in `04-create-empty.png` the product's single most
important input is invisible — placeholder text floating on the background — while the *secondary*
aesthetic question below it gets six large bordered cards occupying about 60% of the screen. The
hierarchy is exactly inverted.

**Root cause, precisely.** `styles.css:610` defines `.dc-input` immediately after `.dc-dock`
(`:609`), the play screen's 48px input dock:

```css
.dc-input { min-width: 0; min-height: 38px; max-height: 38px; resize: none;
            border: 0; background: transparent; … }
```

That is a **one-line chat input** style. `create.tsx:285` reuses the class for the multi-paragraph
world brief, where `max-height: 38px` beats `rows={6}` and beats the Tailwind `resize-y` on the same
element. `.dc-input` has four usages: `PlayStage.tsx:666` (the dock it was written for) and
`create.tsx:285, :362, :651`. Only `:285` is multi-line, and it is the one this breaks.

**Against** spec §1 — *"Visuals should help the user quickly understand… reduce cognitive load"* — and
`prd_world_creation.md`, whose entire premise is prose in, world out. Nothing in the spec asks for a
two-line brief.

---

#### GATE-4 — When the world has been built, the person is not shown what was invented

**Screen** `/create`, `built` state. **Component** `src/routes/create.tsx`, the `built` lane.
**Evidence** `screenshots/09-create-built.png`, and `screenshots/08-create-kickstart.png` /
`08b-create-kickstart-scenario.png` for the two turns before it.

The brief asked directly whether creation "shows them what it invented". Observed answer: **no.**

After the build and both kickstart turns, `09-create-built.png` shows, on an otherwise empty 1600×1000
screen with roughly 70% of it blank:

1. `A NEW WORLD`
2. *"Describe somewhere you want to walk into. A sentence is enough; three paragraphs is better. You
   will arrive knowing nothing about it, which is the point."*
3. `A World From: a nightshift ferry terminal`
4. *"Somewhere someone owes something, and the ledger is open."*
5. `Walk in` · `All worlds`

Two distinct defects, and only the first is the frontend's alone:

**(a) The empty-state instruction copy is still on screen after the world exists.** Line 2 is the
prompt telling you how to write a brief, displayed above a finished world. It is present at every
stage — the interview turn, both kickstart turns, and the built state (visible in `08-`, `08b-`, `09-`).
Instructional copy that outlived its state, and it is the largest block of text on the completion
screen. Straightforwardly this repo's to fix.

**(b) The contract has no room for a payoff.** Lines 3 and 4 are everything the frontend receives:
`world_kickstart_turn/2`'s `done:true` branch carries `world{id, display_name, tagline, playable}` and
nothing else. There is no field for the places, actors or artifacts that were just invented. So the
climactic moment of the product — *the system built you a world* — renders as a title and one line,
because that is all the seam offers. **Against spec §4.4** *"Return a new playable situation: the user
should understand the current moment."*

*Per §1 I do not judge that the title was a truncation of my own words or that the tagline is
identical on all 11 worlds — both are `fake-world-genesis`. The finding is the shape of the moment,
which would be the same shape with a real seat: two strings and two buttons.*

---

#### GATE-5 — The scene canvas fallback contradicts the world-authored place

**Screen** `/w/:worldId/play`, Main Scene Canvas. **Component** `src/components/dc/PlayStage.tsx:451-465`.
**Evidence** `screenshots/11-play-arrival.png`, `screenshots/12-play-after-beat.png`.

The place, in the world's own prose in the aux panel: **"The Counting Room — One lamp over a table, a
ledger open at the current page, two chairs and a door to the yard. The window is painted shut."**

The canvas behind it, occupying about 65% of the screen, is **a moonlit fantasy skyline of castle
spires under an open night sky over water.** Wrong place, wrong scale, wrong genre, and directly
contradicted by the sentence "the window is painted shut" sitting to its right.

This is the no-art fallback: `<div aria-hidden className="dc-stage-art">` with
`backgroundImage: url(backdrop), url(housePlate)` where `housePlate` is the single shared
`src/assets/sky-hero.jpg`.

**Against spec §2.1**, which is unambiguous about this zone: it is *"the visual and emotional center
of the experience"*, it *"should usually answer: Where are we?"*, and it should communicate *"whether
the situation is calm, tense, intimate, public, dangerous, procedural"*. A painted exterior
establishing shot answers all of that wrongly for an interior interrogation over a ledger.

The fix is not "generate art faster". A place with no image must not borrow **a picture of a different
place**; a neutral texture or a mood-derived gradient is honest, a fabricated establishing shot is
not. Note that `src/laws/laws.test.ts:276-302` already forbids falling back to art *named after a
world in the fiction* (`drowned|lantern|tavern|silt|registry`) — the same concern, guarded only at the
filename level, so a generic painted landscape passes.

*Because image generation failed in this environment I saw only this path; I did not see the canvas
with a real place image, and I make no claim about how it reads then.*

---

#### GATE-6 — The transcript cannot hold one beat

**Screen** `/w/:worldId/play`, Conversation / Narration panel. **Component** `PlayStage.tsx`, the
`.dc-transcript` scroller inside the dialogue card.
**Evidence** `screenshots/12-play-after-beat.png`.

One beat produced three messages: the player's line, a narration segment, and the actor's action. The
card shows **one** — the actor's action — with a sliver of the previous row clipped at the top edge.
The player's own sentence has already scrolled out of view. The card is roughly 180px tall against
650px of scene art above it.

**Against spec §3.6**, which sets this as a layout requirement: *"allow the conversation/narration area
to show a full Beat without immediate scrolling"*, and *"The central text panel should be larger than a
normal chat bubble area"*. And against §2.3, which names this panel *"the main interaction surface"* for
a *"text-first"* product. In the running app the text-first surface is the smallest zone on screen and
the decorative fallback is the largest.

Per this repo's `AGENTS.md` the height of `.dc-transcript` is Lovable's to own, so this is reported as
a behavioural minimum being violated, not as a proposed number: a beat must fit.

---

#### GATE-7 — The input promises a command menu that does not exist

**Screen** `/w/:worldId/play`, input dock. **Component** `src/components/dc/PlayStage.tsx:665`.
**Evidence** `screenshots/11-play-arrival.png`, `screenshots/12-play-after-beat.png` — the placeholder
reads `Write an action, speak, or type / for options...`

There is no `/` handler anywhere in `PlayStage.tsx` or the play route. Typing `/` does nothing.

The copy is **not** this repo's invention: spec §3.6 specifies that exact string as the recommended
placeholder. So the spec asked for a feature and only its advertisement shipped. The disposition is
still against the app — a promise on the primary input that the app cannot keep — but the review
records that the string came from the spec, and that removing the `/ for options` clause is a
legitimate resolution.

---

#### GATE-8 — The path to a first world is one link on one screen

**Screens** `/` and `/worlds`. **Components** `src/components/dc/DashboardRail.tsx:18-20` versus
`src/components/dc/SideRail.tsx`.
**Evidence** `screenshots/01-first-contact.png` (rail: `Dashboard`, `Worlds`, `Create`),
`screenshots/03-picker.png` (rail: a compass glyph and `WORLDS`, nothing else).

`/create` is reachable only from `DashboardRail`, which renders only on `/`. The picker at `/worlds`
uses `SideRail`, whose only destination is `Worlds`. A person who lands on or navigates to `/worlds`
has no route to creation and no indication that creation exists.

`src/routes/worlds.tsx:27-28` still carries the reason it was left off — *"Creation exists server-side
but is unauthenticated, so a button on it would be shipping a hole"* — a premise
`src/laws/laws.test.ts:155-168` records as no longer true. The comment outlived the constraint.

**Against spec §1** — the product should feel like *"returning to an ongoing world"*, and the first act
of the product is having one.

*I did not test first contact with zero worlds; the directory had 11. The planned
`02-first-contact-empty.png` was never captured, so the empty-directory path is unreviewed. What the
app would show is `No worlds to enter.` (`worlds.tsx:78`) and `No world has anyone to be yet.`
(`DashboardHome.tsx:184`) — read from source, not observed.*

---

#### GATE-9 — Text inputs have no visible field

**Screens** `/create` and `/w/:worldId/play`. **Component** `src/styles.css:610` `.dc-input`
(`border: 0; background: transparent`).
**Evidence** `screenshots/04-create-empty.png`, `screenshots/08-create-kickstart.png`,
`screenshots/05b-create-interview.png`.

The same rule behind GATE-3 also removes the border and fill from every field using it. The clearest
case is the kickstart screen in `08-create-kickstart.png`: under the heading `OR WRITE YOUR ANSWER`
there is a right-floating `Answer` button with **visibly nothing to its left** — the field the person
is meant to type their own character into is invisible until focused. The same pattern appears at
`05b-create-interview.png` and for the custom art-style field.

**Against** the handoff pack's accessibility floor in §3.3 (*"every control keyboard-reachable with a
visible focus ring"* — focus is handled here, resting state is not) and spec §1's cognitive-load
principle. This is one CSS rule doing damage on three surfaces.

---

#### GATE-10 — Per-world accents are applied with no semantic floor, so primary actions render as danger buttons

**Screen** `/worlds`. **Components** `src/lib/world-theme.ts:46-56` (`worldAccentVars`), consumed by
`src/components/dc/WorldCard.tsx:3`.
**Evidence** `screenshots/03-picker.png`.

The picker's primary `Enter` buttons render **salmon-red** on five cards and **sage-green** on one, in
an otherwise gold-and-navy interface. Filled terracotta `#a2543f` is the destructive-action colour in
essentially every design system; here it is the button that begins play.

The mechanism is faithful and the code is careful — `worldAccentVars` validates the hex, derives a
lightened variant, and picks `--dc-world-on-accent` by relative luminance so **text contrast is
handled**. What is not handled is *semantics*: any hex the backend emits becomes the primary-action
fill. Backend-supplied accents were `#a2543f` ×5, `#5f7a6b`, `#6b8f5a`, `#7a8b99`, `#c9a227` ×3 — the
gold ones look right, the rest look like warnings.

**Against** spec §1's requirement that *"the interaction structure should remain stable"* across genres
while visual content varies. A theme may colour a world; it should not be able to make "begin" look
like "delete". `D-15` — a theme swaps skins, never structure — is the relevant neighbour: action
semantics are structure.

*The specific hexes came from `fake-world-genesis` and I do not judge them. The finding is the absent
floor, which is this repo's.*

---

#### GATE-11 — A manual art trigger sits on a play-path surface

**Screen** `/w/:worldId`. **Component** `src/routes/w.$worldId.index.tsx:241` and its confirm block.
**No screenshot** — I navigated to `/w/:id/play` directly from creation via `Walk in` and never
captured the world home. The planned `10-world-home.png` does not exist. This finding is from source
only and should be confirmed visually before action.

`Regenerate art` / `Redraw cast art?` / *"The current cast portraits are cleared and redrawn in the
background."*

`backend:ADR-P021` and the workspace standing answer are explicit: *"Art is automatic… Never wire a
creation path to a manual image trigger, and never tell a user to press one."* Stated fairly:
`POST /worlds/{id}/images/regenerate` *clears* and lets the reconciler redraw, so this is not
commissioning — but it is a creator/debug affordance on a play surface, which `C-4` and spec §2.6 put
behind creator/debug mode.

---

#### GATE-12 — Journey is received and never rendered

**Screen** `/w/:worldId/play`. **No screenshot** — my beat produced no journey, and I did not force
one via the fixture world. This finding is from contracts and source only; **it is unobserved.**

`scene_current/4` carries a strict `journey_block` (`active`, `kind`, `goal_label`, `where_label`,
`progress`, `legs_done`, `legs_total`, `interruptible`, `status`), and `transcript/2` carries a
per-entry `journey` marker whose own contract describes it as *"the marker the frontend needs to render
travel in history the way it rendered it live."* Neither has a render site — a grep for `journey`
across `src/routes` and `src/components/dc` returns only halt-copy strings. Meanwhile `haltCopy`
(`w.$worldId.play.tsx:63-67`) can say `You are on your way. Continue.`, `The way is shut.` and
`You waited, and it never came.` with nothing on screen to say where, how far, or why.

**Against spec §4.4** — *"Return a new playable situation: the user should understand the current
moment."*

---

### ACCEPT-WITH-REASON

These are right. A later agent "fixing" any of them would damage the product, so they are recorded
deliberately rather than left silent.

---

**ACCEPT-1 — Names are earned, and it is visible on screen.**
`screenshots/11-play-arrival.png`, `12-play-after-beat.png`, `15-`, `16-`, `17-`.
The single actor renders as **"the woman keeping the ledger"** in the cast strip and as
`THE WOMAN KEEPING THE LEDGER` over her line — a descriptor, never a name, never an id. This is the
third differentiator working, live, and it is the best thing in the app. The naming wall is enforced
backend-side (`fn_display_name`, `core/api/namingwall.go`, `20260821120000_name_token_wall.sql:46-66`)
and arrives pre-resolved, so the frontend *cannot* leak an unearned name. It equally cannot
typographically distinguish a descriptor from an earned name — there is no `is_earned` flag on any
play surface, and the only signal in the system is `perceived_name === null` on the four unvendored
compendium schemas. Worth knowing; not a defect to open here.

**ACCEPT-2 — Silhouette on a missing portrait.** `src/components/dc/Portrait.tsx:12-47`, seen in
`11-`, `12-`, `15-`, `16-`, `17-`: a drawn SVG head-and-shoulders inside a gold ring, layout-stable, no
spinner, no broken glyph. Exactly handoff rule 10, and the direct contrast that makes BLOCK-3 a
frontend defect rather than an unavoidable one.

**ACCEPT-3 — Empty states written in the world's voice, not the database's.** Observed:
`You have nothing on you.` and `Nothing presses in on you.` (aux, `11-`), `Say what you do.`
(transcript, `11-`, `15-`), `Nobody to be here yet` (picker, `03-`). From source, unobserved:
`No worlds to enter.`, `No world has anyone to be yet.`

**ACCEPT-4 — The halt-copy seam.** `src/routes/w.$worldId.play.tsx:52-68` is one place where engine
vocabulary becomes player language, used both live and when reading history back —
`telegraph` → *"The world moves — answer it."*, `bounce` → *"That didn't land as possible — say it
differently."*, `gate_reject` → *"The world blocked that."*, `unresolved` → *"Be specific — who or
which?"* — with `Something snagged — try again.` for an unknown reason and `completed` never rendered.
This is the opposite of the bare-machine-string failure the brief warned about. I did not manage to
provoke a halt (`halt_reason` came back `completed`), so `13-play-halt.png` does not exist and the copy
is verified in source only.

**ACCEPT-5 — No progress bar, percentage or ETA during genesis.** `prd_world_creation.md` bans them.
Observed: the build completed in under 3 seconds with fake seats and went straight to the character
kickstart. **`screenshots/07-create-building.png` is misnamed: it does not show a build stream.** It
was captured 6 seconds after clicking build, by which time the build had finished, so it shows the
kickstart turn. The streamed `working` lines and the `Still working. This takes a while.` liveness
copy exist at `create.tsx:435-444` but **I never saw them**, and I could not compare them against the
PRD's specified `Still writing — N seconds in.` wording.

**ACCEPT-6 — Grouping on `speaker_id`, and memories that stay memories.** Consecutive lines fold on
`speaker_id` and never on the label, because two actors may wear the same perceived label on purpose
(`w.$worldId.play.tsx:139-152`, asserted at `src/laws/transcript.test.ts:87`). A stored `speaker_label`
is never re-resolved against present knowledge and a remembered line gets the silhouette rather than
today's face (`:164`, asserted at `src/laws/history.test.ts:205, :222`). Correct per `D-7`/`D-8`.
Source and tests, not observed — my world had one actor and no history.

**ACCEPT-7 — The decay sentence.** `last known — not confirmed since {label}` / `last known — you have
not confirmed this recently` (`w.$worldId.play.tsx:486-488`) is near-verbatim the spec's own
recommended language (§2.4 *"Decay is not visibility"*: *"Last known…"*, *"You have not confirmed this
recently."*) and §4.9, with the tick never rendered (`B-5`). **Not observed** — `Carrying now` read
`You have nothing on you.` throughout, so no decay chip ever rendered.

**ACCEPT-8 — No compendium nav on the world home.** `w.$worldId.index.tsx:258-260` deliberately omits
the four destinations rather than shipping dead links. Correct, and the exact discipline GATE-1 breaks
in the play rail.

**ACCEPT-9 — A live history read never falls back to a bundled capture.** `src/api/load.ts:166-171`.
For a scene a stale capture is an old view of a place that still exists; for a story it is a different
story shown to a reader as their own memory.

**ACCEPT-10 — The interview turn's structure.** `screenshots/05b-create-interview.png`,
`08-create-kickstart.png`, `08b-create-kickstart-scenario.png`. One question at a time, a gold display
question, a "why this matters" subtitle, options each carrying an implication, a `(recommended)`
marker, a free-text alternative, an always-present escape (`Build it now` / `Start here`), and
progress feedback (*"1 answered so far."*). Two kickstart turns confirmed — character
(`Who are you here?`) then scenario (`How does it start?`) — matching
`worldgenesishandler.go:659-686`. The shape is good; per §1 I do not judge the question content, which
came from `fake-world-interview`. *`08b-` I read as extracted text during the run and did not open as
an image.*

**ACCEPT-11 — CSS `text-transform` on speaker labels.** I initially suspected the all-caps
`THE WOMAN KEEPING THE LEDGER` (`styles.css:555`, `.dc-line-label`) of being a rule-1 string transform
hiding in CSS to evade the law test. It is not: `src/laws/laws.test.ts:240-246` explicitly rules that
*"CSS `text-transform` is presentation and always fine"* and scopes the law to JS mutation. **Finding
withdrawn.** What remains is a craft note, not a violation: the mockups set a speaker's name in
normal-case cream serif with the role beneath in gold
(`mock_gameplay_screen.png`, `mock_compendium_actor_seren_v2.png`), and in a naming-wall product where
a label can be a whole clause, uppercase plus `.1em` tracking makes a long descriptor shout. Worth a
designer's eye; not a defect.

---

### Screenshots I did not analyse

Stated rather than given an invented reading:

- **`07-create-building.png`** — misnamed. Captured after the build had already completed; shows the
  kickstart turn, not the build stream. See ACCEPT-5.
- **`08b-create-kickstart-scenario.png`** — I read its content as extracted text during the run
  (`How does it start?` with three options) but never opened the image, so I make no visual claim
  about it.
- **`14-aux-current.png`** — captured to complete the tab set. Its content is the same `Current` panel
  already visible in `11-play-arrival.png`, which is what I analysed. Not separately examined.
- **`17-play-rail-dead.png`** — captured, but GATE-1 rests on the DOM inspection and click test, not
  on the image. I did not open it; it is the post-click state, and the point is that it is
  indistinguishable from the pre-click state.

Planned captures that **do not exist**, so the corresponding paths are unreviewed:
`02-first-contact-empty`, `06-create-styles`, `10-world-home`, `13-play-halt`, `18-play-history`,
`19-play-no-art`, `20-mist-theme`, `21-error-unreachable`, `22-404`, `23-login-gate`, `24-journey`.
The Railway 502 (§1, Limit 2) is what stopped the configured-base error state in particular.

---

## 4. App versus mockup

Where the app diverges I say whether the mockup is better. **Several mockup elements are illegal under
current law** — the mockups are reference, not authority, and `docs/handoff/reference-vs-law.md` is the
strike table.

| Surface | Mockup | What the mockup does | What the app does | Mockup better? | Disposition |
|---|---|---|---|---|---|
| Play — overall composition | `mock_gameplay_screen.png` | Full-bleed painted scene; floating rail, dialogue card and aux island on gutters; populated top bar | Same language, genuinely achieved: full-bleed art under a scrim, floating islands, gold hairlines, Cinzel display (`11-play-arrival.png`) | **No — the app matches it** | accept-with-reason |
| Play — scene canvas | `mock_gameplay_screen.png` | A painted market street that *is* the stated place | A shared fantasy skyline contradicting "the window is painted shut" (`11-`, `12-`) | **Yes** | GATE-5 |
| Play — participants | `mock_gameplay_screen.png` | Four 126px ringed portraits, name + role beneath, active aura + speaking badge | One ringed silhouette, label beneath, speaking badge present (`12-`). Role line absent; no sprite layer (no art existed) | Yes, but blocked on art | GATE-5 / unreviewed |
| Play — dialogue card | `mock_gameplay_screen.png` | Speech in cream Garamond with an italic stage-direction line beneath; card tall enough for the exchange | Correct two-field prose/quote treatment; card too short to hold one beat (`12-`) | **Yes, on height only** | GATE-6 |
| Play — aux tab strip | four `mock_aux_lens_*.png` | `Current · Inspect · Intent · Known` | `Current · Previously · Open threads` — one real, two invented | **Yes** | BLOCK-1, GATE-2 |
| Play — aux `Current` | `mock_aux_lens_current.png` | Title, small-caps place/act line, italic prose, `TIME`, `What matters now` bullets, `Right here, right now` | Very close: title, prose, `Atmosphere`, `Time`, `What matters now` bullets (`14-`, `11-`). Missing only the closing "right now" beat | Marginally | accept-with-reason |
| Play — aux `Open threads` | `mock_gameplay_screen.png` | `The Lost Relic — High` / `Strange Disturbances — Medium` / `Who is Seren? — Low` | Three invented cards, no severity labels | **No — the mockup is illegal** (`GA-3`, handoff rule 8; and spec §2.4 "not a quest tracker"). The app is wrong for a different reason | BLOCK-1 |
| Play — rail | `mock_gameplay_screen.png` | Eight items incl. `Entities`, `Relationships`, `Known World`, `Corrections`, `Settings` | Four items: `Timeline`, `Actors`, `Locations`, `Artifacts` — all inert | **No — the mockup is illegal** (`F-1` rule 5; `B-3` rule 6; spec ERRATA line 2 removes Relationships). The app's vocabulary and set are correct; the buttons are dead | GATE-1 |
| Play — top bar | `mock_gameplay_screen.png` | World title, `Act I · Dawnfall Market`, day pill, `Known World` pill, avatar `Aria / Storyweaver` with a green presence dot | Place title, tone chip, `Arrival` pill, three icon buttons, no identity (`11-`) | **No** — the avatar and presence dot are struck by handoff rules 12–13; `Act I` is a progress claim with no payload | accept-with-reason |
| Actor dossier | `mock_compendium_actor_seren_v2.png` | Name + gold italic *"Market informant, as you currently know her."*; `Collected knowledge` grouped by source with counts; `Last known` | **Surface does not exist** | **Yes, decisively** — and the italic "as you currently know her" is the best perceived-vs-canon device in the whole asset set | BLOCK-2 |
| Actor dossier — right column | `mock_compendium_actor_seren_v2.png` | `Relationship to you` with a trust slider and padlock | Does not exist | **No — illegal** (`B-3`/`B-4`, handoff rule 6). Copy the visual treatment, never the content | — |
| `Known` lens | `mock_aux_lens_known_actor.png` | `KNOWN` / `LAST-KNOWN` / `UNCERTAIN` / `INFERRED` as glyph + gold small-caps label + prose, diamond dividers | Does not exist | **Yes** — this is the reference to build from | BLOCK-2, GATE-2 |
| `Intent` lens | `mock_aux_lens_intent.png` | `Interpreted Intent`, numbered units with large gold ordinals, a dashed conditional sub-unit, confidence footer | Does not exist | **Yes for the lens; no for the details** — per-row edit pencils are struck (`D-14`) and `High (82%)` is struck (rule 2, `confidence` never written) | GATE-2 |
| `Inspect` lens | `mock_aux_lens_inspect_artifact.png` | Painted object, italic sensory prose, `What you notice`, `You could…` | Does not exist. Nearest live analogue is `quick_inspect_preview` in `Carrying now` | Yes for the lens; `You could…` is struck unless backend-generated | BLOCK-2 |
| Location dossier | `mock_compendium_location_dawnfall_market.png` | `Part of`, `Known areas inside`, `Key actors seen here`, `Collected knowledge` grouped by topic | Does not exist | Yes — **except** the `Location Hierarchy` tree (struck, `C-12`) and `Seen 1h ago` (struck, `B-5`) | BLOCK-2 |
| Timeline | `mock_compendium_timeline.png` | Horizontal day ribbon, per-day columns, future days dimmed with `No records yet`, detail panel `What happened` / `Why it matters` | Does not exist | **Yes, decisively.** The dimmed-future treatment is an elegant not-yet-known device. `Linked entitiers` [sic] is struck (`F-1`, and a typo) | BLOCK-2 |
| Picker / dashboard | *no mockup* | — | Illuminated-chronicle language achieved; one broken cover glyph; five near-identical tiles; red/green primary buttons (`01-`, `02a-`, `03-`) | n/a | BLOCK-3, GATE-10 |
| Creation | *no mockup* | — | A 38px brief field on a half-empty column; six style cards dominating; no payoff at the end (`04-`, `05-`, `09-`) | n/a — **this surface has no design reference at all**, which is likely why it is the weakest | GATE-3, GATE-4 |

**Correction to the record:** the divergence is *not* the one `docs/handoff/surfaces/screenshots/`
implies. Those captures show an unstyled document — flat navy, bulleted link lists, mosaic broken
portraits — and led me to expect a bare skeleton. The live app has the palette, the typefaces, the
full-bleed art, the floating islands and the ornament. The visual-language gap the handoff pack
describes has largely been closed. What remains missing is **half the product's surfaces** and the
**perception vocabulary**, which is a content and IA gap, not a styling one.

---

## 5. Two law-test holes, which is the most reusable output here

Both BLOCK-1 and GATE-1 are live *because* a guard checks a spelling instead of a behaviour. This
repo's `AGENTS.md` argues that mechanism beats prose; these are two places where the mechanism has a
gap the same shape.

| Law | Where | What it checks | How it was walked through |
|---|---|---|---|
| Provenance (rule 2, `D-7`) | `src/laws/laws.test.ts:304-370` | every **`.json`** a route can reach declares a `schema_version` | invented content lives in `playVisualMocks.**ts**` |
| No dead nav (rule 13, `D-14`) | `src/laws/laws.test.ts:236-241` | the literal string `href="#"` | four `<Button>` elements with no handler |

Suggested widening, stated as a direction and not designed here: the provenance law should cover
exported object literals in `.ts`/`.tsx` modules reachable from `src/routes/`, and the dead-nav law
should assert that every element carrying the rail-item class resolves to a route.

---

## 6. The single change I would make first

**Delete `src/components/dc/playVisualMocks.ts` and the two aux tabs that render it
(`src/components/dc/PlayStage.tsx:691-700` and `:712-717`), leaving `Current` as the sidebar's only
lens.**

Why this one, ahead of everything else:

- It is the only finding where the interface **states falsehoods about the player's world**. Everything
  else is missing, mis-sized, mis-coloured or broken; this is the one place the product lies, on its
  primary surface, in the world's own voice, in every world, forever.
- The product's entire thesis is *known world, not omniscient world* — that what you see is what your
  character has perceived. Three fabricated "open threads" contradict the thesis directly. Nothing
  else in the review does that.
- It is a **deletion**, so it cannot regress anything and needs no design decision.
- It improves the sidebar honestly. One lens that tells the truth is worth more than three where two
  are fiction, and it leaves the tab strip empty for `Intent` and `Known` — the two the spec actually
  asks for (GATE-2) — to arrive into.

Pair it in the same change with widening the provenance law (§5) so this content cannot return a third
time under a fourth file extension.

**Then, immediately second — and it is one line:** remove `max-height: 38px` from `.dc-input`
(`src/styles.css:610`) or stop `create.tsx:285` from using that class. One CSS declaration is
currently reducing the product's entire entry point — a few hundred words of prose — to a two-line
scrolling window with the writer's own opening sentence clipped out of view (GATE-3). It is the
cheapest large improvement available.
