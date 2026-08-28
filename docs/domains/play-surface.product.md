# play-surface · product

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-2 · The play surface and the core loop ·
**Parent bounded context:** Compendium & Play UX

This file holds what the domain *means* — its job, its language, its product rules, what is
deliberately not built. `play-surface.tech.md` holds how it is built; `play-surface.seams.md` holds
what crosses its boundary.

---

## What this domain is for

**One job: the screen where the world is played — the beat, the transcript, and the input.**

The handoff pack says it without hedging: *"This is the product. Everything else is reference
material the player consults between beats"* (`docs/handoff/surfaces/03-play.md:12`). This domain
owns the play route's **behaviour**: what data reaches the screen, in what state, and which
interactions are legal. It never decides what is true — the backend does (`D-7`) — and it never
decides how anything looks — Lovable does (`AGENTS.md` §The seam; see `seams.md`).

The stance the whole surface serves: *"The product should feel like a living world, not a prompt
IDE"* — quoted via `digest/01_TOPIC_MAP.md` §UX-2; the source UX-loop document is gone from the
backend tree (`tech.md` §Open questions). Diegetic beats dashboard everywhere on this screen.

## Ubiquitous language

| Term | Means, precisely |
|---|---|
| **Message → Beat → Scene Segment → Scene** | The interaction granularity, smallest first. A Message is the smallest visible UI unit; a Beat is the interactive rhythm; a Scene is internal mechanics the player never needs to notice (`digest/S09` Topic 17). |
| **Beat** | One press of Send or Continue and everything the world returns for it. One transcript entry is a **beat, not a line** (`src/api/history.ts:20-24`). |
| **Continue** | Advances the current moment by exactly one beat, never a fast-forward (`C-6`). Carries no body: `stated` is null for a Continue press — a different fact from an empty string. |
| **Transcript / the record** | The one read surface that is a RECORD, not a projection — delivered prose stored as delivered, never recomputed (`src/api/history.ts:6-15`). |
| **`text` / `quote`** | Two fields of one narration segment. `quote` is verbatim spoken words without quotation marks; `text` is prose — for `speech` it is only the staging and is legitimately empty (`AGENTS.md` §Prose and speech). |
| **Staging** | The action prose around a spoken line. The player spells it with asterisks; the client reads that for display only (`src/lib/rp-text.ts`). |
| **Participant** | A being with presence and agency in the scene. Narrower than Actor: an organization is an Actor but appears only through an agent who speaks for it. |
| **Halt** | The engine's reason a beat stopped (`telegraph`, `bounce`, …). Engine vocabulary — always mapped to a player sentence, never shown raw (`F-2`; `src/routes/w.$worldId.play.tsx:44-68`). |

`entity` is banned in all copy here; the user-facing word is **Actors** (`GA-2`, `F-1`).

## What this domain is not

- **Not the truth.** The frontend writes nothing and never performs a knowledge check (`D-7`). A
  value the payload does not carry is not rendered, ever.
- **Not the look.** Tokens, layout, chrome, motion belong to Lovable (`seams.md`).
- **Not the compendium.** Indexes, dossiers and the timeline are UX-1's reference surfaces.
- **Not the world picker or dashboard.** `/` and `/worlds` are their own surfaces (`AGENTS.md` §The
  dashboard).

## Product rules — decisions already made

Ids resolve in `dreamchat-world-backend/docs/law/06_rules_register.md`; the thirteen visual rules in
`docs/handoff/README.md` §3 restate these and are authoritative only through the backend id each
cites (that file's own banner).

| Id | What it settles | What breaks if you ignore it |
|---|---|---|
| `D-7` | World strings render verbatim; no invented field; the frontend never decides truth. | A client-side "fix" of ugly data is fiction the world never wrote. |
| `B-1` | Grouping is on `speaker_id`, never label — two actors may carry the identical label on purpose. | Grouping by label fuses two people into one on screen. |
| `B-5` | No wall-clock, ever; time is the world's own labels; a tick is ordering only, never displayed. | One "2 hours ago" breaks the fiction's clock. |
| `C-6` | Continue advances one beat, never a fast-forward. | Autoplay: "500 meaningful actions in 40 seconds." |
| `C-10` | Scene Participants shows only beings with presence/agency. The spec's own example: *"A guard holding a warrant can appear as a participant. The warrant itself should not"* (`digest/S09` Topic 14). | Objects, factions and documents become avatars. |
| `C-11` | Correction is world direction, not debugging — invisible by default, present-forward; Continue implicitly accepts. No pending/approval UI, ever. | A review queue turns the world into a prompt IDE. |
| `GA-2`, `GA-3` | Genre-agnostic vocabulary and structure; no severity/urgency taxonomy, no hardcoded genre sections. | A "Quests" panel fails the noir thriller and the workplace drama. |
| `D-8` | Silhouette on null portrait; image URLs built only from the payload's `path`; never re-fetch on a text change. | A label-keyed image leaks identity through the picture. |
| `D-14` | No navigation to surfaces that do not exist. | Dead buttons are promises the product cannot keep. |

## What is deliberately not built here

Each absence is a decision with a receipt (`digest/S11_frontend.md` Topic 27 gathers them; per-item
sources cited there).

- **The four-lens tab strip, the Inspect and Known lenses.** Two of four lenses have no endpoint;
  *"a strip with two dead tabs is scaffolding. The strip lands when Inspect and Known do."*
- **Per-unit Intent editing.** No endpoint. The pencil icons wait for it.
- **Any corrections affordance.** Rule-struck (`C-11`), not pending — never build it.
- **A viewer selector.** The player never picks who they are (`D-7`, `C-4`); whose perception is on
  screen is decided server-side.
- **A scene backdrop.** `place.image` does not exist in `scene_current/4`. Design as if it will
  arrive; the surface must still read without it (`docs/handoff/README.md` §5).
- **Suggested-action buttons replacing free input.** Suggestions may help stuck users but never
  replace natural language (`digest/S09` Topic 13, §2.3).
