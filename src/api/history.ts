import { apiBase, imageUrl, type ImageRef, type NarrationMessage } from "./index";

/**
 * The played history — everything said and generated in this world, read back.
 *
 * # The one file the relay touches
 *
 * The backend's transcript read is still being built, so the wire shape below is **provisional**:
 * agreed in outline (viewer-scoped, player text plus delivered narration segments, paginated
 * newest-first) and not yet pinned to a published schema. Everything downstream — the merge, the
 * pager, the surface — speaks the DOMAIN type at the bottom of this file, never the wire type. When
 * the schema lands, `HISTORY_PIN`, `HistoryPayload` and `toRemembered` change and nothing else does.
 *
 * Until it lands the read is capability-detected: a backend that does not serve it answers 404, and
 * a world with no history reads exactly like a world whose history is empty. Neither is an error and
 * neither shows the reader a broken affordance.
 *
 * # Why the record is rendered and never re-resolved
 *
 * A stored entry is a **perception record**: what this viewer was told, at the moment they were told
 * it. It is not a pointer into the world as it stands now (D-7).
 *
 * That distinction is the whole reason this file resolves faces itself instead of handing speaker ids
 * to the live cast. Three hours ago the world said *"a hooded figure draws back into the smoke."*
 * The viewer now knows that figure was Mara. Painting Mara's name or portrait onto that old line
 * would rewrite what the viewer was told and leak an identity backwards through their own memory
 * (B-1). The label stays "a hooded figure" forever, and the picture beside it is the one the record
 * carries — or the silhouette, if it carries none.
 */

/**
 * PROVISIONAL. Replaced with the published id when the backend's schema is relayed.
 *
 * It is a real pin, not a placeholder: a payload that does not carry it fails the read the same way
 * every other pin in this client does. If the backend ships a different id, this read goes dark
 * loudly rather than parsing an unknown shape (D-4).
 */
export const HISTORY_PIN = "transcript_history/1";

/** How many entries a page asks for. The server may return fewer; only `next` decides if more exist. */
export const PAGE_SIZE = 40;

/** PROVISIONAL wire shape — see the note above. */
type HistoryEntry =
  | { kind: "player"; text: string }
  | { kind: "narration"; message: NarrationMessage; image?: ImageRef | null };

/** PROVISIONAL wire shape — see the note above. Entries arrive NEWEST first. */
type HistoryPayload = {
  schema_version: string;
  entries: readonly HistoryEntry[];
  /** Opaque cursor for the page of OLDER entries, or null when the beginning has been reached. */
  next: string | null;
};

/**
 * One remembered line, in the shape the transcript already speaks.
 *
 * `face` is resolved here and carried, so nothing downstream is tempted to look the speaker up in
 * the present cast. `remembered` is what stops a stored line and a live line from the same speaker
 * folding into one card: they can carry different labels and different faces, and merging them would
 * put today's name over yesterday's words.
 */
export type Remembered =
  | { who: "you"; text: string; remembered: true }
  | { who: "world"; message: NarrationMessage; face?: string | undefined; remembered: true };

/** A page of history, oldest-first and ready to sit above whatever came after it. */
export type HistoryPage = {
  /** Oldest-first, the order the transcript reads in. */
  readonly older: readonly Remembered[];
  /** Cursor for the page before this one, or null at the beginning of the record. */
  readonly next: string | null;
};

/** Wire → domain. The only place the provisional shape is understood. */
function toRemembered(entry: HistoryEntry): Remembered {
  if (entry.kind === "player") return { who: "you", text: entry.text, remembered: true };
  return {
    who: "world",
    message: entry.message,
    // The picture the record carries, at the size a transcript draws it. No image is the ordinary
    // state and the silhouette is what it looks like (D-8) — never today's portrait for an old line.
    face: entry.image ? imageUrl(entry.image, "thumbnail") : undefined,
    remembered: true,
  };
}

/**
 * Turn a newest-first payload into an oldest-first page.
 *
 * Exported for the tests, because reversing a paginated feed is exactly the kind of thing that looks
 * right and is backwards.
 */
export function toPage(payload: HistoryPayload): HistoryPage {
  return { older: [...payload.entries].reverse().map(toRemembered), next: payload.next };
}

/** The read said there is no such thing — no history endpoint, or no history for this world. */
export const NO_HISTORY = Symbol("no_history");
export type FetchedPage = HistoryPage | typeof NO_HISTORY;

/**
 * Read one page of this world's history for the viewer.
 *
 * `before` is the cursor from the previous page; omitted asks for the most recent entries. A 404 is
 * not a failure: it is a backend that does not serve history yet, and the surface simply has none.
 */
export async function fetchHistory(world: string, before?: string): Promise<FetchedPage> {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (before !== undefined) query.set("before", before);
  const url = `${apiBase()}/worlds/${encodeURIComponent(world)}/transcript?${query.toString()}`;

  const res = await fetch(url);
  if (res.status === 404) return NO_HISTORY;
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const payload = (await res.json()) as HistoryPayload | null;
  if (payload?.schema_version !== HISTORY_PIN) {
    throw new Error(`schema mismatch: expected ${HISTORY_PIN}, received ${String(payload?.schema_version)}`);
  }
  return toPage(payload);
}

/**
 * Paging state for the history read.
 *
 * A reducer rather than a tangle of `useState`, because the interesting part is not fetching — it is
 * the order things end up in. Pages arrive newest-first and each new page belongs BEFORE everything
 * already on screen, which is the one operation a scroll region cannot get wrong quietly: prepend
 * the wrong way and the reader's story runs backwards.
 */
export type HistoryState = {
  /** Everything loaded so far, oldest-first — the order it is read in. */
  readonly lines: readonly Remembered[];
  /** Cursor for the next page of OLDER entries. Null once the beginning has been reached. */
  readonly next: string | null;
  readonly loading: boolean;
  /**
   * Which cursor is currently being fetched, or undefined when nothing is.
   *
   * This is what makes the reducer idempotent. A scroll region fires many events per gesture and a
   * page takes a moment to arrive, so the same cursor can easily be asked for twice — and a page
   * applied twice does not look like a bug, it looks like the world repeating itself. A page whose
   * cursor is not the one in flight is dropped.
   */
  readonly inFlight: string | null | undefined;
  /** False once a read says the backend does not serve history. No affordance is offered for it. */
  readonly available: boolean;
  /** True when a read failed. The reader is told rather than left with a silently short record. */
  readonly failed: boolean;
};

export const HISTORY_START: HistoryState = {
  lines: [],
  next: null,
  loading: false,
  inFlight: undefined,
  available: true,
  failed: false,
};

export type HistoryAction =
  | { type: "loading"; from: string | null }
  | { type: "page"; page: HistoryPage; from: string | null }
  | { type: "absent" }
  | { type: "failed" };

/** True when there is an older page to ask for and we are not already asking. */
export function canLoadOlder(state: HistoryState): boolean {
  return state.available && !state.loading && state.next !== null;
}

/** True once every page has been read — the reader is looking at the beginning of the record. */
export function atBeginning(state: HistoryState): boolean {
  return state.available && !state.loading && state.next === null;
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, failed: false, inFlight: action.from };
    case "page":
      // A page nobody is waiting for is a duplicate or a straggler from a cancelled read. Applying it
      // would prepend the same stretch of story twice.
      if (!state.loading || state.inFlight !== action.from) return state;
      // Older entries go in FRONT. This is the whole reason the reducer exists.
      return {
        ...state,
        lines: [...action.page.older, ...state.lines],
        next: action.page.next,
        loading: false,
        inFlight: undefined,
        failed: false,
      };
    case "absent":
      // No endpoint, or nothing recorded. Not a failure, and not something to apologise for.
      return {
        ...state,
        lines: [],
        next: null,
        loading: false,
        inFlight: undefined,
        available: false,
        failed: false,
      };
    case "failed":
      return { ...state, loading: false, inFlight: undefined, failed: true };
  }
}
