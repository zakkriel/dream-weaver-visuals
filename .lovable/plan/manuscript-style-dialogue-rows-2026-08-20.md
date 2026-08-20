# Manuscript-style dialogue rows

## Direction
Replace the literal speech-bubble treatment with the selected **Manuscript row hierarchy**: one continuous reading surface with restrained rows, slim accent rails, and subtle tonal washes.

## Changes
- Remove individual bubble borders, rounded containers, tails, and chat-like right-floating blocks.
- Render character turns as full-width manuscript rows with the existing portrait prepended, a slim warm-gold rail, speaker label, and a faint background shade that fades into the card.
- Render player turns as full-width rows with a quieter neutral rail and a distinct low-contrast shade; keep the existing “You” attribution and action/speech parsing.
- Keep narration centered, borderless, italic, and visually quieter so it reads as prose rather than dialogue.
- Tighten vertical rhythm so consecutive entries remain easy to track without making each line feel like a separate card.

## Mechanics preserved
- Keep payload text verbatim, speaker grouping, correct portrait lookup, line order, transcript scrolling, auto-follow, history pagination, expanded-record behavior, input actions, and reduced-motion behavior unchanged.
- Limit implementation to `PlayStage` transcript markup/classes and visual tokens/styles; no route, API, contract, fixture, or game-mechanics changes.

## Validation
- Check the docked and expanded transcript views in the browser.
- Confirm character portraits remain aligned and correctly prepended, long text wraps, player/character/narration rows are immediately distinguishable, and the transcript remains scrollable.
- Run the focused transcript/law tests after the visual change.
