# Surface 2 — World home

**Route:** `#/w/<world>` · **Screenshot:** `screenshots/09-home.png` · **Mockup:** none.
**Endpoint:** none of its own — it renders links only. The world theme comes from `GET /worlds`.

The landing page inside a world, reached by a bare world URL. It is currently the **weakest surface in
the product**: an `h1` reading "Compendium" and an **unstyled `<ul>` of six links** — Actors,
Locations, Artifacts, Timeline, Play, Other worlds.

## What is on screen now

```
Compendium
 • Actors
 • Locations
 • Artifacts
 • Timeline
 • Play
 • Other worlds
```

That is the entire surface. No world name, no art, no summary, no sense of where you are.

## Field by field

Nothing is world-authored here except, potentially, the world's own name — which the surface **does
not currently show**, although it is available from `world_directory/1` (`display_name`, and the
`theme` that is already applied to the page).

| Element | Kind | Notes |
|---|---|---|
| "Compendium" heading | chrome — **restylable text** | Ours, not the world's. It may be renamed, replaced or removed. |
| The six links | chrome | Labels are Glossary-fixed for the four compendium destinations (law §3.1 rule 5). "Play" and "Other worlds" are ours and may be reworded. |
| World identity | **missing** | `display_name` is available and unused. Showing it here is an obvious win. |

## Open questions for the design

1. **Should this surface exist at all?** A bare world URL could land straight on Play. If it stays, it
   needs a reason to exist — an at-a-glance state of the world as this character knows it.
2. It is the natural home for world identity: name, atmosphere, where you are, when it is.
3. The rail already offers the same four destinations. Duplicating them as a list is the current
   design's whole content, and it is redundant.

## Constraints

- The four compendium labels are fixed: **Actors, Locations, Artifacts, Timeline** `[GA-2, F-1]`.
- Do not add destinations that do not exist (Settings, Corrections, Search, Profile) `[D-14]`.
- Anything summarising the world must come from a payload. There is no "world summary" endpoint today,
  so **do not design one in** without telling us — it would need a backend field (law §3.1 rule 2).
