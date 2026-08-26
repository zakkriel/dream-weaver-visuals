# DreamChat — visual handoff pack

> **Provenance and scope.** This pack was generated on 2026-08-09 against `dreamchat-frontend`
> `main` — the **predecessor** repo, now archived and superseded by this one
> (`workspace:ADR-W003`). Two consequences, and they cut in opposite directions:
>
> - **§3's thirteen rules ARE the live law for the visual side**, cited as such by this repo's
>   `AGENTS.md`. But their authority is the **backend rule ID each one cites** — `D-7`, `B-1`, `B-5`,
>   `C-11`, `GA-3` and the rest, whose text lives in
>   `dreamchat-world-backend/docs/00_strategy/06_rules_register.md`. This file restates them for a
>   design tool that cannot read that repo; it does not own them (rule **D-6**).
> - **Everything here about ports, schema versions, or contracts is historical.** The live contract is
>   `contracts/` at this repo's root, drift-checked by `bun run verify:contract`; the live pins are the
>   `const PIN` block in `src/api/index.ts`; the live dev port is **5273**, not 5173. Where this pack
>   and those disagree, those win.

**For a UX/design tool (Lovable) and the founder. Self-contained: you do not need this repo's history,
its git log, or any conversation to use it.**

Generated 2026-08-09 against `dreamchat-frontend` `main` and a live backend. Everything in here is a
real capture, not an illustration.

---

## 1. What this product is

DreamChat is a persistent AI RPG world. A player types what they do; a world engine decides what is
true and what that player is allowed to know; this frontend renders the result. **Every screen is one
character's perception of a world, not the world.**

The look is an **illuminated chronicle**: deep midnight ground, warm gold, serif display type, glass
panels floating in lamplight. Two things define that direction, and both are the founder's:

| Direction source | Where | What it establishes |
|---|---|---|
| The `fantasy` skin | shipped and live — its values are listed under *Current token contract* just below | Navy `#0d1320`, gold `#c9a227`, **Cinzel** display, **EB Garamond** body, 10px glass blur, gold glows, a two-layer atmosphere and a scene scrim. |
| `pixel-perfect-companion` | the founder's own Lovable build, June | The full target: full-bleed painted scene, floating islands on 20px gutters, 100px icon rail, 126px portraits with a breathing aura, a 330px panel column, film grain at 4.5% overlay, Cinzel + Cormorant Garamond + Inter. |

The current app is **behind** that target. It has the palette and the typefaces; it does not have the
art, the floating composition, the depth, the texture or the motion. Closing that is the job.

### Current token contract (what exists today, all of it restylable)

```
ground        #0d1320          border         rgba(150,124,66,0.32)
surface       rgba(20,27,44,0.60)             text          #e9e3d3
surface-raised rgba(30,40,66,0.70)            text-muted    #9aa0b2
accent        #c9a227          accent-strong  #e0b65c        on-accent #1a1206
display face  "Cinzel", Georgia, serif
body face     "EB Garamond", Georgia, serif
type scale    12 / 14 / 16 / 20 / 24 / 32 / 44 px
space scale   4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
radius        4 / 8 / 14 / 999 px
shadow        0 8px 24px rgba(0,0,0,.45)  ·  0 16px 48px rgba(0,0,0,.60)
glow          0 0 22px rgba(201,162,39,0.32)
blur          10px
motion        180ms cubic-bezier(.4,0,.2,1), zero keyframes
```

Known gaps against the reference, already measured: radii are roughly **half** the reference's
(14 vs 20–28), there is **no UI/chrome typeface** (chrome uses the narrative serif), there is **no
inset top highlight**, **no film grain**, **no ambient motion**, and dividers are solid rather than
gradients that fade at both ends.

---

## 2. What the tool OWNS — change any of this freely

**All of it. Every pixel.** Specifically:

- **Tokens** — every colour, the whole type scale, spacing, radii, shadows, glows, blur, easing,
  durations. Add tokens that do not exist yet (a UI typeface, an inset-highlight, a grain layer, a
  third shadow tier, gradient dividers).
- **Layout** — the app shell. Today it is a CSS grid with `rail | main | aux` columns and
  `bar / body / input` rows, docked, with 1px borders between slots and no gutters. Turning that into
  floating islands over a backdrop is expected and welcome.
- **Chrome** — the nav rail, the top bar, the input dock, the aux sidebar, panels, cards, buttons,
  chips, badges, portraits, the disclosure caret.
- **Typography** — families, sizes, weights, line-heights, tracking, small-caps, text shadows.
- **Motion and ornament** — transitions, ambient loops, entrance behaviour, gradients, textures,
  vignettes, borders, flourishes, dividers, background art treatment.
- **Composition** — where things sit, how much breathing room, what floats above what, reading
  measures, empty-state presentation.

If it is how something *looks*, it is yours.

---

## 3. What the tool MUST NOT change — the law

These are not preferences. Each is an adjudicated rule with a real reason; several exist because
breaking them leaks information a character has not earned, which destroys the game. Rule ids are in
brackets so we can trace any question back to the source.

### 3.1 Text and data

**1. Render world text exactly as it arrives — never rewrite, summarise, title-case, truncate to
change meaning, or "improve" it.** `[D-7]`
The engine authors every world string. It is fiction written for that character. Restyle it, wrap it,
size it, never edit it. §4 of every surface file marks precisely which strings are world-authored.

**2. Never invent a field the payload does not carry.** `[D-7]`
No confidence percentages, no relationship strength, no "3 days ago", no computed counts the engine
did not send, no placeholder lorem that could be mistaken for content. If a design needs a value that
is not in `contracts/`, **say so and we will ask the backend for it** — that is a normal, welcome
request. Do not fill the hole client-side.

**3. Never show anything not in the payload for the current viewer.** `[B-1, I-3, D-7]`
The backend already removed everything this character does not know. A thing being absent is the
answer, not a gap to fill. Never add "hidden"/"unknown"/"locked" affordances implying withheld
content, and never distinguish "does not exist" from "you may not see it" — they arrive identically
on purpose.

**4. No wall-clock time, ever.** `[B-5]`
Time renders only as the world's own labels — "Arrival", "Day 3, Morning", "the third bell". Never
"2 hours ago", "Seen 1h ago", a timestamp, or a date. Payloads carry an integer `tick` for ordering
only: **never display a tick.**

**5. Vocabulary is the Glossary's, not the database's.** `[F-1, F-2, GA-2]`

| Use | Never use |
|---|---|
| Actors | Entities, NPCs, Characters(as a nav label) |
| Locations | Places(as a nav label), Regions |
| Artifacts, Carrying | Possessions, Inventory, Items, Loot |
| Timeline, Known World | Log, History, Graph, Database |
| "Last known…", "remembered, not verified" | "unverified", "stale record", "cache" |

Engine tokens (`perception_record`, `epistemic_type`, `projection`, `canon`) must never reach the
screen. The nav rail's four labels — **Actors, Locations, Artifacts, Timeline** — are fixed.

### 3.2 Surfaces and affordances

**6. No relationship UI of any kind.** `[B-3, B-4]`
No panel, meter, slider, heart, trust bar, affinity number, or "Relationship to you" card. The system
never states how a character feels about the player. ⚠️ **The founder's own reference implements
this** — `mock_compendium_actor_seren_v2.png` has a "Relationship to you" card with a trust slider,
and `pixel-perfect-companion` has a **Relationships** nav item. Both are struck. Copy the card's
*visual treatment*, never its content.

**7. No corrections, approval, or pending-change UI. Ever.** `[C-11]`
Correction is invisible by design: pressing Continue implicitly accepts. Never design a review queue,
a diff, a pending badge, an "approve/reject" control, or an "unsaved changes" state. An explicit lock
control and a "Report issue" entry point are the only permitted affordances in this area.

**8. No severity, priority or urgency taxonomy.** `[GA-3]`
No High/Medium/Low, no red/amber/green ranking, no "importance" sort, no urgency score. ⚠️ **Also in
the reference** — the gameplay mockup and the companion both show "Open threads" with High/Medium/Low.
Struck. The world does not compute urgency, so displaying it would be invented data (rule 2).

**9. No hardcoded genre sections.** `[GA-3]`
No fixed "Rumors", "Combat", "Quests", "Stats" regions. Every surface must read correctly for a
noir thriller, a workplace drama and a horror story, not just for high fantasy. Section headings come
from the payload or are structural ("Collected knowledge"), never from a genre taxonomy.

**10. Pictures: silhouette on null, and never re-fetch on a text change.** `[D-8]`
Any portrait may be absent — that is the ordinary state, not an error. Show a silhouette; never a
spinner, a broken-image icon, a "no image" message, or a reserved empty hole that shifts layout when
art arrives. Narration never waits on a picture. Also: a character's *name* changes as the player
learns more, while their picture does not. **Never key an image off a label, and never add a
cache-buster or a re-request when text changes** — the URL must stay byte-identical across renders.

**11. Image URLs expire — only ever build them from the payload's `path`.** `[D-8]`
The payload carries a stable path; the server redirects it to a signed URL that dies in minutes.
Never store, cache, log or inline a resolved image URL. Request `{apiBase}{path}?tier=thumbnail`
(256px) / `?tier=preview` (768px) / `?tier=final` (1024px) and let the browser follow the redirect.

**12. The player never picks who they are.** `[D-7, C-4]`
No viewer/character selector, no "view as", no perspective switcher. Whose perception is on screen is
decided server-side. Debug and creator tooling is out of scope entirely.

**13. Do not add navigation to surfaces that do not exist.** `[D-14]`
No Settings, Corrections, Relationships, Known World, Search or Profile entries unless we ask for
them. A nav item that goes nowhere is a promise the product cannot keep.

### 3.3 Accessibility floors (not negotiable, but not restrictive)

- Body text **≥ 4.5:1** against its own background; large display text ≥ 3:1. The dark palette makes
  this easy — just check gold-on-navy at small sizes.
- Every control keyboard-reachable with a **visible** focus ring. Focus styling is yours to design;
  its existence is not.
- Two characters can share the same visible name on purpose — the fiction requires it. Never
  number them on screen to disambiguate; the accessible name handles it.
- Honour `prefers-reduced-motion`: ambient loops must stop.

---

## 4. What is in this pack

```
README.md            ← you are here: the brief and the law
port-back.md         ← how work returns to the codebase, and the acceptance gate
surfaces/            ← one file per surface: screenshot, real payload, field-by-field notes
  screenshots/       ← current state, 10 PNGs, captured 2026-08-09 at 1600×1000
contracts/           ← the 9 JSON Schemas the surfaces consume, plus a guide
fixtures/            ← real captured payloads + a zero-dependency mock server + sample portraits
```

**Read in this order:** this file → `fixtures/README.md` (get something running) → the surface file
for whatever you are designing → `port-back.md` before you send anything back.

### The nine surfaces

| # | Surface | File | Mockup |
|---|---|---|---|
| 1 | World picker | `surfaces/01-world-picker.md` | none — direction is open |
| 2 | World home | `surfaces/02-world-home.md` | none |
| 3 | Play | `surfaces/03-play.md` | `mock_gameplay_screen.png` ✅ |
| 4 | Actors index | `surfaces/04-actors-index.md` | none |
| 5 | Actor dossier | `surfaces/05-actor-dossier.md` | `mock_compendium_actor_seren_v2.png` ✅ |
| 6 | Locations index + dossier | `surfaces/06-locations.md` | `mock_compendium_location_dawnfall_market.png` ✅ |
| 7 | Artifacts index + dossier | `surfaces/07-artifacts.md` | none |
| 8 | Timeline | `surfaces/08-timeline.md` | `mock_compendium_timeline.png` ✅ |
| 9 | Aux sidebar + Carrying | `surfaces/09-aux-and-carrying.md` | `mock_aux_lens_{current,intent,known_actor,inspect_artifact}.png` ✅ |

**Mockups are not bundled.** They live in the `dreamchat-world-backend` repo at
`docs/20_design_ux/mockups/`. The founder should attach the relevant PNGs when briefing the tool. They
are direction, not specification — several contain the struck items listed in §3.2, and the surface
files say which.

---

## 5. Three things worth knowing before you design

**The data is thin and lopsided, and that is the real world.** One character has 25 knowledge entries;
another has none. The artifacts index is **empty**. Some names are `null`. Some descriptions are
engine debug strings full of ids like `#1786309829959189000-5`. **Design for this**, not for the
mockups' tidy fictional content — empty states and ugly-string overflow are the common case today.

**Portraits are currently placeholder mosaics.** The sample PNGs in `fixtures/assets/` are what the
app really renders right now. Real painted art is coming from a separate pipeline and will drop into
the same slots at the same sizes with no design change.

**There is no scene artwork yet.** The reference's full-bleed painted backdrop is the single largest
visual difference, and the payload does not carry a scene image — we have asked the backend for one.
Design the play surface *as if it will arrive* (the shell already supports a backdrop layer), but make
sure it still reads with no image at all, because that is today's state and some worlds may never have
art.
