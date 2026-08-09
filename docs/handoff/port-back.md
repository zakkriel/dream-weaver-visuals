# Port-back protocol — how design work returns to the codebase

You designed it in Lovable. This is how it becomes the shipped product, what we can take directly,
what has to be translated, and the gate it has to pass.

---

## 1. What we accept, and in what form

The frontend is a **token-first CSS system**: no Tailwind, no CSS-in-JS, no component library. Plain
React components emitting `.dc-*` class names, one hand-written stylesheet each, every value reaching
them through a `--dc-*` custom property. That difference is the whole reason this document exists.

| # | Artefact | Form we want | Lands in | Difficulty |
|---|---|---|---|---|
| 1 | **Token values** | A flat list: name → literal value. Hex, px, rem, a full `box-shadow` string, a gradient. | `src/ds/skins/fantasy.css` — one block, one file | **Trivial.** The best possible return. |
| 2 | **New tokens** | Same, plus one line on what it is for | same file | **Trivial** |
| 3 | **Component look** | The CSS rules for one component: padding, radius, border, background, shadow, type. Tailwind classes are fine — we translate. | that component's `.css` file | **Easy** |
| 4 | **Layout structure** | The grid/flex definition with literal track sizes, insets, gutters, z-order | `src/ds/primitives/AppShell.css` | **Moderate** |
| 5 | **New ornament layers** | The literal CSS — a grain overlay, a vignette, a gradient divider recipe | a skin file or the shell | **Easy** |
| 6 | **Motion** | Keyframes + duration + easing, and what triggers it | the component's CSS | **Easy** — must respect `prefers-reduced-motion` |
| 7 | **Composition changes** | Screenshots + a note on what moved where and why | component JSX | **Moderate** — the most valuable and the most work |

### What we cannot take as-is

| Not portable | Why | What to send instead |
|---|---|---|
| **React components** | Different data layer, different props, different accessibility contracts, and our components carry rules yours cannot know | The CSS and a screenshot |
| **Tailwind utility markup** | No Tailwind in this repo | The computed CSS, or the class list — we translate |
| **shadcn/ui or Radix components** | Not dependencies here, and we would inherit a component library through the back door | The visual treatment only |
| **A component library or design-system package** | Same | — |
| **Anything that fetches, transforms, sorts or filters payload data** | That is where the law lives; a restyle must not touch it | Say what you need and we will wire it |
| **New copy for world-authored strings** | Rewriting world text is the one unforgivable change `[D-7]` | Flag it and we will ask the backend |

**The single most valuable thing you can send is a token block plus a screenshot per surface.** That
alone moves the product a long way and carries almost no risk.

### Nice to have with any return

- Which font families, weights and styles, and whether they are self-hosted. We self-host; we cannot
  take a runtime CDN dependency.
- Any raw colour that is *not* a token, and where it is used. We have a test that fails the build if a
  raw colour appears outside `src/ds/skins/` — so anything you invent inline has to become a token.
- Contrast measurements for text on its actual background, if you changed the palette.

---

## 2. How it lands

**One pass, one PR.** Not one giant restyle.

1. We read the return and split it into passes — tokens first, then per-surface component CSS, then any
   layout structure. Tokens land in one PR because they change every surface at once and are trivially
   revertible.
2. **Tests are not touched.** The suite tests *behaviour and rules*, not appearance: which strings
   render, that a tick never appears, that the nav has no banned labels, that a stale record survives,
   that no verb buttons exist in Carrying, that portraits do not re-request. A restyle that breaks a
   test has almost certainly broken a rule — **the test is right until proven otherwise**, and we come
   back to you rather than editing it.
3. Every PR passes four gates before review: type generation matches the vendored schemas, the vendored
   schemas match the backend, the build is clean, and the full suite is green.
4. Every PR is **driven in a browser** against a live backend, and carries before/after screenshots of
   every affected surface.

### Where things physically go

```
src/ds/skins/fantasy.css      ← tokens: colour, type, shadow, glow, blur, atmosphere, scrim
src/ds/skins/moods.css        ← per-world atmosphere overrides (nocturne, mist, ember, …)
src/ds/skins/fonts/           ← self-hosted woff2 + @font-face
src/ds/primitives/*.css       ← Panel, Button, Chip, Badge, InputField, PortraitFrame, NavRail, …
src/ds/primitives/AppShell.css ← the shell grid, backdrop layer and scrim
src/ds/composed/play.css      ← scene canvas, participants, journey bar, aux lenses, Carrying
src/ds/composed/Dossier.css   ← all three dossiers
src/ds/composed/KnowledgeList.css, Timeline.css
src/ds/catalog/catalog.css    ← the epistemic source line
```

Raw colour literals are permitted **only** in `src/ds/skins/`. Everywhere else must go through
`var(--dc-*)`, and a test enforces it.

---

## 3. The acceptance gate

**Side-by-side screenshot parity per surface, judged by the founder.** That is the gate. Not a pixel
diff, not a checklist — the founder looking at the two images and saying yes.

For each of the nine surfaces we produce:

```
before: the surface as it ships today
after:  the same surface, same data, same viewport, after the port
target: the Lovable output (and the mockup where one exists)
```

Same world, same seeded data, same 1600×1000 viewport, captured against a live backend — so the only
variable is the design.

### A surface passes when

1. **The founder says it matches the intent.** Final word, no appeal to a spec.
2. **Every string still renders**, unedited, in the same order the payload gave.
3. **No banned element appeared** — checked against README §3: no relationship UI, no severity, no
   approval affordance, no wall-clock, no invented field, no banned vocabulary, no ticks on screen.
4. **The four gates are green** and the suite is untouched.
5. **The awkward data still works** — the empty artifacts index, the 55-item dossier, the nameless
   actors, the light `mist` world, a participant with no portrait. We screenshot these too.
6. **Contrast holds** — body text ≥ 4.5:1 on its real background.
7. **Keyboard focus is visible** on every control.

### What a "no" looks like

A surface that fails is not reverted wholesale. We report *which* item failed with the evidence — a
measurement, the payload field, or the rule id — and it goes back for one more turn. Tokens usually
pass first time; composition changes usually take two.

---

## 4. Working agreement

- **Ask rather than invent.** "This design needs a one-line summary on the index cards" is a normal,
  welcome message. We will ask the backend. Filling the hole client-side is the one thing that cannot
  be undone quietly, because it looks like it works.
- **Send early and partial.** A token block on its own is immediately useful and can ship in an hour.
  Waiting for a complete redesign of nine surfaces delays all of it.
- **Tell us when a rule blocks a good idea.** Several rules exist for reasons that may expire — two
  documented deviations expired this month when the backend changed, and we re-opened both. A rule with
  a dead reason should be challenged; a rule with a live reason will not move.
- **Screenshots beat descriptions**, and screenshots at 1600×1000 against the fixtures in this pack
  beat screenshots of invented content.
