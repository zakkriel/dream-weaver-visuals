/**
 * Visual-only placeholders for the play chrome.
 *
 * These are deliberately isolated from scene payloads and game mechanics so the
 * corresponding backend fields can replace them without changing the layout.
 */
export const playVisualMocks = {
  previous: [
    {
      title: "A conversation left unfinished",
      detail: "The last exchange still hangs over the room.",
    },
    {
      title: "A path not yet taken",
      detail: "Another direction remains open to you.",
    },
  ],
  threads: [
    {
      title: "The unanswered invitation",
      detail: "Someone is waiting for your response.",
    },
    {
      title: "The object out of place",
      detail: "A small detail asks for a closer look.",
    },
    {
      title: "The way beyond this place",
      detail: "There is more to discover when you move on.",
    },
  ],
} as const;