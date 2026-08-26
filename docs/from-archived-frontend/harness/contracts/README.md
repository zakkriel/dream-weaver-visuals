# Vendored API contract

These JSON Schemas are vendored **verbatim** from `dreamchat-world-backend` **main** at
`core/api/schema/`. They are the source of truth for the TypeScript types in `src/types/`.

They are **not** only the Compendium contract. The set is everything this repo codes against:

| Schema | Surface |
|---|---|
| `compendium_index.v1` | the Actors / Locations / Artifacts indexes |
| `actor_page.v2`, `location_page.v1`, `artifact_page.v1` | the dossiers |
| `timeline.v1` | the Timeline spine |
| `scene_current.v2` | the play surface's scene read |
| `beat_frame.v2` | the beat-loop stream |
| `world_directory.v1` | the world picker |

- **Do not hand-edit** these files or the generated types. To update: re-copy from backend main,
  then run `npm run gen:types`.
- `npm run verify:types` (hermetic) fails if `src/types/` drifts from these schemas. **In CI.**
- `npm run verify:contract` fails if these copies drift from backend main. **In CI since PR #19** —
  no manual run is owed on a PR. It prefers a sibling `../dreamchat-world-backend` checkout and
  falls back to `raw.githubusercontent`, which is what happens on a runner. Consequence worth
  knowing: this is the one gate whose result depends on another repository at the moment it runs, so
  a backend contract change can turn a green PR here red without anyone touching this repo. That is
  intended — drift should be loud.
- **A nested payload can change without the envelope's version moving.** `beat_frame` held at `/2`
  while its embedded scene definition bumped to `scene_current/2`. "The version did not change" does
  not mean "the schema did not change"; `verify:contract` is the only thing that catches it.
