# Surface 7 — Artifacts (index + dossier)

**Routes:** `#/w/<world>/artifacts`, `#/w/<world>/artifacts/<id>`
**Screenshot:** `screenshots/07-artifacts-index.png` — **the index is empty**
**Mockup:** none for the dossier. The closest reference is `mock_aux_lens_inspect_artifact.png`, which
is a *lens*, not this page — see surface 9.
**Endpoints:** `GET …/compendium/artifacts` → `compendium_index/1`; `…/artifacts/{id}/page` →
`artifact_page/1` · **Fixture:** `fixtures/payloads/index_artifacts.json`

## The real payload

```json
{
  "schema_version": "compendium_index/1",
  "world_id": "2222…",
  "viewer_id": "2ac7…a1",
  "kind": "artifact",
  "entries": []
}
```

**Zero entries.** That is not a capture error — the seeded world genuinely has no artifacts in the
compendium, so the empty state is the *only* state you can see today. Design it properly; it is what
the founder will look at.

## A live inconsistency worth knowing

The player **is carrying** an artifact — `Sealed Note (gray wax)`, see `fixtures/payloads/carrying.json`
— and the Carrying overlay links to its dossier. That link currently lands on **Not found (404)**,
because the Compendium holds nothing about the object.

This is arguably honest: the Compendium lists what is *known*, Carrying lists what is *held*, and you
can carry something you know nothing about (`quick_inspect_preview` is `null`). It is also a poor
experience, and it is **raised with the backend**. For design purposes: **the "Not found" state is
reachable from a normal click** and deserves a real treatment rather than a bare panel.

## The dossier fields

`artifact_page/1` mirrors the actor dossier — `perceived_name`, `current_synthesis`,
`last_known_status`, `collected_knowledge_groups`, `inline_links` — plus artifact-specific fields for
type, location and holder.

⚠️ **Those three are `null` in every payload the backend can currently produce.** Design the slots;
expect them empty.

## The empty index — what it may and may not say

| Allowed | Not allowed |
|---|---|
| "Nothing yet" in story language — "You are carrying nothing you have learned about." | "0 items" / "No results found" — database voice `[F-2]` |
| A quiet, composed empty state that looks intentional | A skeleton loader implying content is coming |
| A route to Carrying, if that reads naturally | "Some artifacts may be hidden" — implies withheld content `[B-1, I-3]` |
| | An "Add artifact" affordance — the player never authors canon `[D-7]` |

## Vocabulary

**Artifacts** (the compendium of known objects) and **Carrying** (what is on your person) are two
different surfaces and are **never merged**. Never use *Possessions*, *Inventory*, *Items*, *Loot*,
*Equipment* or *Gear* anywhere `[GA-2, F-1]`.
