# Surface 4 — Actors index

**Route:** `#/w/<world>/actors` · **Screenshot:** `screenshots/03-actors-index.png` · **Mockup:** none.
**Endpoint:** `GET /worlds/{w}/compendium/actors` → `compendium_index/1`
**Fixture:** `fixtures/payloads/index_actors.json`

The list of every actor this character knows of. Locations and Artifacts use the **identical**
payload shape and the identical component — restyling this restyles all three indexes.

## The real payload — all of it

```json
{
  "schema_version": "compendium_index/1",
  "world_id": "22222222-2222-2222-2222-222222222222",
  "viewer_id": "2ac70000-0000-0000-0000-0000000000a1",
  "kind": "actor",
  "entries": [
    { "id": "2ac70000-0000-0000-0000-0000000000a1", "perceived_name": null },
    { "id": "2ac70000-0000-0000-0000-0000000000a2", "perceived_name": "Mara" },
    { "id": "2ac70000-0000-0000-0000-0000000000aa", "perceived_name": null }
  ]
}
```

**That is the entire index payload.** An id and a nullable name. No portrait, no subtitle, no count,
no last-seen, no summary.

## Field by field

| Field | Kind | Notes |
|---|---|---|
| `entries[].perceived_name` | **world-authored — verbatim, nullable** | **Two of three are `null` in the live capture.** The app prints the literal word "Unknown". A nameless-but-known actor is normal and permanent, not a loading state. |
| `entries[].id` | internal | Never render. Link target only. |
| `kind` | data | `actor` \| `location` \| `artifact`. Singular; the route is plural. |
| `entries` empty | data → state | **The artifacts index is genuinely empty right now** — see surface 7. |

## What is on screen now

An `h1` and an **unstyled `<ul>` of browser-default links**. Two of the three read "Unknown". No
avatars — because the index payload carries none.

## The honest design constraint

You will want portraits, subtitles and counts on these cards. **The payload has none of them.** Adding
them means either fetching every dossier (expensive, and it changes what the client asks for) or a
backend field.

**This is exactly the case to raise with us rather than fill in.** "The index needs a thumbnail and a
one-line summary per entry" is a reasonable, welcome request — we will ask the backend. Inventing a
placeholder subtitle, deriving initials as a fake avatar, or showing a "0 records" count would each
violate law §3.1 rule 2.

What you *can* do with today's payload: typography, density, ordering as given, empty-state design,
the treatment of `null` names, and how a list of bare names can still feel like a chronicle.
