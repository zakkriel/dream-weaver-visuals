# Surface 1 — World picker

**Route:** `#/` · **Screenshot:** `screenshots/01-picker.png` · **Mockup:** none exists.
**Endpoint:** `GET /worlds` → `world_directory/1` · **Fixture:** `fixtures/payloads/world_directory.json`

The product's front door and the only surface with no world. It therefore has **no world theme** — no
mood, no accent — so it renders the house skin alone and is the one place the base look is seen pure.

**This surface has no mockup and no reference.** The founder's companion app has no picker. Direction
is genuinely open; propose one.

---

## The real payload

```json
{
  "schema_version": "world_directory/1",
  "worlds": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "display_name": "Mara 0A Fixture",
      "theme": { "mood": "mist", "accent": "#7a8b99", "ornament": "none", "schema_version": "world_theme/1" },
      "playable": true
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "display_name": "The Drowned Lantern",
      "theme": { "mood": "nocturne", "accent": "#c9a227", "ornament": "filigree", "schema_version": "world_theme/1" },
      "playable": true
    }
  ]
}
```

## Field by field

| Field | Kind | Notes |
|---|---|---|
| `display_name` | **world-authored — verbatim** | "Mara 0A Fixture" is a real seeded world name. Dev worlds have ugly names; do not tidy them. Must wrap: assume up to ~60 characters. |
| `id` | internal | A UUID. **Never render it.** It builds the link target only. |
| `theme.accent` | data → colour | A hex the world chose. The app already derives a strong variant, a focus ring and a black-or-white on-accent from it by luminance. Today it is shown as a 0.7em dot. **Better uses welcome** — a card edge, a glow, a wash — as long as the accent stays readable and derived, not hand-picked per world. |
| `theme.mood` | data → atmosphere | One of `nocturne`, `mist`, `daylight`, `ember`, `bleak` **or any word we have never seen**. Unknown values must degrade silently to the default look. ⚠️ Currently rendered as the literal word "nocturne" on the card — that is engine vocabulary on the front door and should stop (law §3.1 rule 5). |
| `theme.ornament` | data → motif | `filigree`, `rivet`, `vine`, `circuit`, `none`, or anything else. Same degrade rule. Currently also rendered as a raw word; same problem. There is a token for it that nothing draws with — **an ornament motif per world is an open, welcome design idea.** |
| `playable` | data → state | `false` means the world has nobody to be. The app currently shows a chip reading "Nobody to be here yet" and still lists the world. Keep both: it exists, you just cannot enter it. |

## What is on screen now

- `h1` "Worlds" at 44px Cinzel; sub-line "Choose a world to enter." at 16px muted.
- A `auto-fill minmax(260px, 1fr)` grid of plain panels: 24px padding, 14px radius, one flat shadow.
- Inside each: world name at 24px, the accent dot + raw mood/ornament words, then two text links
  **Play · Look around**.
- No product mark, no chrome, no rail, no art. 32px page padding, no max-width, content hugs the left.

## Known problems to solve here

1. **No product identity.** Nothing says DreamChat. First impression is a bare list.
2. **Two cards on a wide screen leave five empty grid tracks** and cling to the left edge.
3. **`Play · Look around`** is two undifferentiated text links. Entering a world to *play* and browsing
   its compendium are very different acts and read identically.
4. **Engine vocabulary** — `nocturne · filigree` — is shown raw.
5. **No sense of the world** before you enter it. The accent is the only signal, at 0.7em.

## Constraints specific to this surface

- **Read-only. Never design a "create world" affordance** — no button, no `+` tile, no empty-state CTA.
  Creation exists server-side but is unauthenticated, and a control for it would be shipping a hole.
  A test asserts the absence of any create form.
- Both links must stay reachable per world: play, and browse.
- A world with a broken or missing accent must still render — the theme can be refused, and then the
  card falls back to house tokens.
