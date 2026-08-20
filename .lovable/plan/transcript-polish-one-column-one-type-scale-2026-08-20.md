# Transcript polish: one column, one type scale

## What's wrong now
- Narration/notes are centered and inset by 8% while every other row is full-width left-aligned, so the reading edge jumps line to line.
- Four competing text sizes in one card (speech 1.25rem, narration/note 1rem, action 0.93rem, label 0.86rem), which makes the dialogue look noisy and unbalanced.
- The row washes and rails are so faint they read as inconsistency rather than structure.

## The fix

### One reading column
- All rows — character, player, narration, note — share the same left text edge and the same right measure. Narration loses the centering and the 8% inset; it stays visually quieter through color and slant, not through a different geometry.
- Narration keeps a rail slot too (transparent rail, same indent) so text never shifts sideways between a spoken line and prose.
- Rows without a portrait reserve the portrait gutter so the text column is identical everywhere.

### One type scale
Three sizes total, all Cormorant body:
- Speech: 1.15rem, regular weight, normal color.
- Prose (narration, note, staging/action): 1.05rem italic, muted color — same size for all three so nothing looks accidentally shrunken.
- Speaker label: 0.8rem, letter-spaced small caps-style, gold for characters, muted for the player.
Line-height unified so consecutive rows sit on a consistent rhythm.

### Quieter, more deliberate structure
- Character rows: 2px gold rail at a consistent opacity, no background gradient except a very faint left-anchored wash.
- Player rows: same geometry, neutral rail, no wash — distinguished by rail color and label only.
- Narration: no rail, no wash, italic and muted, with slightly more vertical breathing room above/below so it reads as a scene beat between voices.
- Consistent row spacing (single value) and hover state kept subtle.

## Not touched
Payload text stays verbatim; speaker grouping, portrait resolution, order, scrolling, auto-follow, history pagination, expanded mode, input actions, and reduced-motion behavior are unchanged. Work is limited to `src/components/dc/PlayStage.tsx` transcript markup/classes and the transcript styles in `src/styles.css`.

## Validation
Browser check of docked and expanded transcript, then the law/transcript tests.
