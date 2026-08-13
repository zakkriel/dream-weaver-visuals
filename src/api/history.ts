import { apiBase, apiFetch, type NarrationSegment, type Transcript } from "./index";

/**
 * The played history — everything said and generated in this world, read back.
 *
 * # A record, not a projection
 *
 * Every other read in this client is a projection: ask again and the backend recomputes it from
 * world state. This one cannot be. The prose a model wrote once is gone the moment it is not stored,
 * so `transcript/1` returns what was **delivered**, exactly as delivered.
 *
 * That is why an old line still says *"the muscle by the bar"* after the viewer learns the name
 * Jonas. A memory of an experience is itself a perception (D-7), and re-labelling it would rewrite
 * what the viewer was told. The backend freezes `speaker_label` at delivery and pins that with its
 * own tests; this client renders the record and never re-resolves it against the present cast.
 *
 * History begins when the feature shipped. Beats played before it are not stored, and nothing here
 * invents them.
 *
 * # One entry is a BEAT, not a line
 *
 * `stated` is the player's raw input — null when he pressed Continue and typed nothing, which is a
 * different fact from an empty string. `segments` is the delivered narration in order, in the same
 * shape a live `beat_frame/4` narration frame carries, so both render through one path.
 */

/** Cursor for the next older page. `entry_no` is a row handle, not domain time — a tick cannot order. */
export type Cursor = number;

/**
 * One remembered thing, in the shape the transcript already speaks.
 *
 * `remembered` is what stops a stored line and a live line from the same speaker folding into one
 * card: they can carry different labels, and merging them would put today's name over yesterday's
 * words. No face travels with it — `transcript/1` carries no image per entry, so a remembered line
 * wears the silhouette, which is the honest picture of a memory (D-8).
 */
export type Remembered =
  | { who: "you"; text: string; remembered: true }
  | { who: "world"; message: NarrationSegment; remembered: true }
  | { who: "note"; text: string; remembered: true };

/** A page of history, oldest-first and ready to sit above whatever came after it. */
export type HistoryPage = {
  /** Oldest-first, the order it is read in. */
  readonly older: readonly Remembered[];
  /** Cursor for the page before this one, or null at the beginning of the story. */
  readonly next: Cursor | null;
};

/**
 * Flatten one stored beat into the lines it was read as.
 *
 * The player's own words first, then the narration in delivered order — the same order the live
 * surface builds as a beat streams. A halt is rendered by the caller in player language; the raw
 * reason never reaches the screen (F-2), so it is carried through as a marker, not as text.
 */
function entryLines(entry: Transcript["entries"][number], halt: (reason: string) => string): Remembered[] {
  const out: Remembered[] = [];
  // Null means a Continue press: he typed nothing. An empty string would be him sending nothing,
  // which the surface does not allow — either way there is no line of his to draw.
  if (entry.stated !== null && entry.stated !== "") {
    out.push({ who: "you", text: entry.stated, remembered: true });
  }
  for (const message of entry.segments) out.push({ who: "world", message, remembered: true });
  // `completed` is the ordinary ending and says nothing worth reading back.
  if (entry.halt_reason !== null && entry.halt_reason !== "completed") {
    out.push({ who: "note", text: halt(entry.halt_reason), remembered: true });
  }
  return out;
}

/**
 * Turn a newest-first payload into an oldest-first page.
 *
 * Two reversals in one: entries arrive newest-first and must be read oldest-first, while the lines
 * WITHIN an entry are already in delivered order and must not be touched. Exported for the tests,
 * because that is exactly the kind of thing that looks right and is backwards.
 */
export function toPage(payload: Transcript, halt: (reason: string) => string): HistoryPage {
  const older: Remembered[] = [];
  for (const entry of [...payload.entries].reverse()) older.push(...entryLines(entry, halt));
  return { older, next: payload.next_before };
}

/** The read said there is no such thing — no transcript for this world, or none for this viewer. */
export const NO_HISTORY = Symbol("no_history");
export type FetchedPage = HistoryPage | typeof NO_HISTORY;

/** The pin. A payload that is not this shape fails the read rather than being guessed at (D-4). */
const PIN = "transcript/1";

/**
 * Read one page of this world's story for the viewer.
 *
 * `before` is `next_before` from the previous page; omitted asks for the most recent beats. A 404 is
 * not a failure — it is a world with no record, and the surface simply has no history to show.
 */
export async function fetchHistory(
  world: string,
  halt: (reason: string) => string,
  before?: Cursor,
): Promise<FetchedPage> {
  const query = new URLSearchParams();
  if (before !== undefined) query.set("before", String(before));
  const q = query.toString();
  const url = `${apiBase()}/worlds/${encodeURIComponent(world)}/transcript${q === "" ? "" : `?${q}`}`;

  const res = await apiFetch(url);
  if (res.status === 404) return NO_HISTORY;
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const payload = (await res.json()) as Transcript | null;
  if (payload?.schema_version !== PIN) {
    throw new Error(`schema mismatch: expected ${PIN}, received ${String(payload?.schema_version)}`);
  }
  return toPage(payload, halt);
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
  readonly next: Cursor | null;
  readonly loading: boolean;
  /**
   * Which cursor is currently being fetched, or undefined when nothing is.
   *
   * This is what makes the reducer idempotent. A scroll region fires many events per gesture and a
   * page takes a moment to arrive, so the same cursor can easily be asked for twice — and a page
   * applied twice does not look like a bug, it looks like the world repeating itself. A page whose
   * cursor is not the one in flight is dropped.
   */
  readonly inFlight: Cursor | null | undefined;
  /** False once a read says this world has no record. No affordance is offered for it. */
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
  | { type: "loading"; from: Cursor | null }
  | { type: "page"; page: HistoryPage; from: Cursor | null }
  | { type: "absent" }
  | { type: "failed" };

/** True when there is an older page to ask for and we are not already asking. */
export function canLoadOlder(state: HistoryState): boolean {
  return state.available && !state.loading && state.next !== null;
}

/** True once every page has been read — the reader is looking at the beginning of the story. */
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
      // No record for this world. Not a failure, and not something to apologise for.
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
