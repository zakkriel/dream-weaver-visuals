# Dream Weaver Visuals

can you use the current local Repo??


You are extending this project into the complete visual layer for DreamChat, a persistent

AI RPG world. This project already contains my approved design direction — the gameplay

screen you see here (midnight ground, gold accents, Cinzel display type, floating glass

islands over a painted scene, film grain, breathing portrait auras) is the target quality

bar for EVERYTHING. Your job: bring nine app surfaces up to this bar. The knowledge file

"DreamChat — visual handoff pack" is the contract; read it fully before designing.

THE JOB

Redesign every surface listed in the knowledge file §4: world picker, world home, play,

actors index, actor dossier, locations, artifacts, timeline, and the aux sidebar with

carrying overlay. Reuse and evolve this project's existing visual language — do not

invent a second design system. Build everything as data-driven React components with

typed props that mirror the payload shapes in the knowledge file exactly: every string

you display must come from a prop that exists in those payloads. Use the sample payloads

as your demo data, verbatim — including the empty ones.

HARD RULES (from the knowledge file §3 — these are game-logic laws, not preferences):

- World text renders exactly as it arrives. Never rewrite, summarize, or title-case it.

- Never invent data: no percentages, counts, "3 days ago", or filler that reads as

content.

  If a design needs a field the payloads lack, add a note "NEEDS BACKEND FIELD: x"

instead.

- No wall-clock time anywhere. Time is only the world's own labels ("Day 3, Morning").

  Never display a tick integer.

- Nav vocabulary is fixed: Actors, Locations, Artifacts, Timeline. Nothing else, and no

  nav items to surfaces that don't exist (no Settings, Search, Profile, Relationships).

- NO relationship UI (no trust sliders/meters/hearts) — even though my own old mockups

  have one; it is struck. Keep the card's visual treatment, drop its content.

- NO High/Medium/Low or any urgency taxonomy — also struck from my old mockups.

- NO corrections/approval/pending UI. No review queues, no diffs, no pending badges.

- No hardcoded genre sections (no "Quests", "Combat", "Stats"). Must read correctly for

  noir, workplace drama, and horror, not just fantasy.

- Portraits: silhouette when the image field is null — an ordinary state, never a spinner

  or broken-image. Layout must not shift when art arrives. Image URLs are built ONLY from

  the payload's path field; never cache or hardcode a resolved URL.

- No character/viewer selector of any kind.

- Body text contrast ≥ 4.5:1, visible focus rings on everything, ambient motion stops

  under prefers-reduced-motion.

DESIGN FOR THE REAL DATA

The payloads are thin and lopsided on purpose: some lists are empty, some names null, one

dossier has 25 entries and another has zero. Empty states are the common case — make them

beautiful, not apologetic. Long ugly strings must wrap without breaking layout.

THE PLAY SURFACE

Follow this project's existing gameplay screen composition: full-bleed scene backdrop

(design it to also work with NO backdrop image — solid atmosphere gradient fallback),

floating islands on ~20px gutters, icon rail, portrait strip with active-speaker aura,

narration + input as one glass dialogue card, aux panels floating right.

START: show me the world picker first — there is no mockup for it; propose a direction

worthy of a front door: world cards on glass, each carrying its own accent color and mood

word from the payload. Then we go surface by surface.

 ```

 Per-surface follow-up template (attach that surface's .md + mockup + screenshot each

 time):

 ```

Next surface: [NAME]. Attached: the surface spec (real payload + notes on which strings

are world-authored), my old mockup (direction only — the spec lists what's struck from

it), and the current implementation screenshot (the floor, not the target). Build it with

the attached payload as demo data, including its empty/null cases. Flag anything you

wish the payload carried as "NEEDS BACKEND FIELD: x" — do not fake it.

 ```

 Two notes: the pack says portraits are mosaics — stale by a few hours, real painted

 portraits are already live, so tell Lovable to design portrait slots for real art (the

 fixture PNGs in fixtures/assets/ are outdated). And when it flags NEEDS BACKEND FIELD

 items, bring them to me — place.image (the scene backdrop) is already queued and I can

 have the backend land others while you iterate. When you're happy with the result, hand me

 the project link or export and the port-back loop starts, surface by surface,

 screenshot-gated.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a775bf30-84c9-465d-9970-ece9121762d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
