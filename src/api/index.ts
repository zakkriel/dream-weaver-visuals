import type { WorldDirectory2GETWorldsTheWorldsACallerMayChooseBetweenSPEC028ADIRECTORYNeverCanonAnIdANameALineOfFictionALookACoverWhereYouLeftOffAndWhetherAnyoneCanPlayItNoWorldSTATEOnThisSurface as WorldDirectoryT } from "./types/world_directory";
import type { SceneCurrent2WhereYouAreWhoIsPresentWhatMattersNowGETWorldsWSceneCurrent as SceneCurrentT } from "./types/scene_current";
import type { BeatFrame3OneSSEFrameOfPOSTWorldsWBeatsDesign48Rung3Task3 as BeatFrameT } from "./types/beat_frame";
import type { Carrying as CarryingT } from "./types/carrying";

/**
 * The transport seam. Every request the app makes is built here and nowhere else.
 *
 * Generated type names carry each schema's `title`, which is a whole sentence, so they are aliased
 * once here and the rest of the app reads normally. `src/api/types/` is CODEGEN — never hand-edit it;
 * `verify:types` diffs it byte-for-byte against the vendored schemas.
 */
export type WorldDirectory = WorldDirectoryT;
export type WorldSummary = WorldDirectory["worlds"][number];
export type Scene = SceneCurrentT;
export type Participant = Scene["participants"][number];
export type JourneyBlock = NonNullable<Scene["journey"]>;
export type BeatFrame = BeatFrameT;
export type NarrationMessage = Extract<BeatFrame, { kind: "narration" }>["message"];
export type BeatOutcome = Extract<BeatFrame, { kind: "result" }>["result"];
export type Carrying = CarryingT;
export type CarriedItem = Carrying["carried"][number];

/**
 * A picture the backend holds for something, or the absence of one. `null` is the ordinary state and
 * what the placeholder is for (D-8) — art arriving later is a payload change, never something this
 * client subscribes to or polls for.
 */
export type ImageRef = NonNullable<Participant["image"]>;

/** 256 / 768 / 1024 px. The backend defaults to `preview` when none is asked for. */
export type ImageTier = "thumbnail" | "preview" | "final";

/**
 * The schema version each endpoint is pinned to, by EXACT string equality.
 *
 * Not a family check on purpose. `scene_current/2` and `scene_current/3` are different contracts, and
 * reading v3 data through v2 field access is the failure mode this exists to make impossible. When a
 * pin moves, the vendored schema, the generated types and this constant all move in one commit.
 */
const PIN = {
  worlds: "world_directory/2",
  scene: "scene_current/3",
  beat: "beat_frame/3",
  carrying: "carrying/1",
} as const;

/** Thrown when a payload's `schema_version` is not the one this client was generated against (D-4). */
export class SchemaMismatchError extends Error {
  constructor(
    readonly expected: string,
    readonly received: unknown,
  ) {
    super(`schema mismatch: expected ${expected}, received ${String(received)}`);
    this.name = "SchemaMismatchError";
  }
}

/** Single sentinel for "the API said 404". Carries NO withheld-vs-nonexistent distinction (B-1, I-3). */
export const NOT_FOUND = Symbol("not_found");
export type Fetched<T> = T | typeof NOT_FOUND;

/**
 * The one configurable backend origin.
 *
 * Empty by default, which makes every request a same-origin relative path handled by the dev proxy in
 * `vite.config.ts`. That is deliberate: a proxy means no CORS dependency, and it means the Lovable
 * preview — where no proxy and no backend exist — simply fails the fetch and falls back to fixtures
 * instead of failing a preflight in a way nobody can debug from inside the editor.
 */
export function apiBase(): string {
  return (import.meta.env["VITE_API_BASE"] ?? "").replace(/\/$/, "");
}

/**
 * Fetch + status + `schema_version` handling, shared by every read.
 *
 * 404 → `NOT_FOUND`; any other failure → throw; a payload whose version is not the pin → throw. The
 * client never guesses at an unknown shape: it fails the load and the caller renders its own
 * not-found or degraded surface. Degrading to "could not load" is honest; reading v3 through v2 is not.
 */
async function getJson<T>(url: string, expected: string): Promise<Fetched<T>> {
  const res = await fetch(url);
  if (res.status === 404) return NOT_FOUND;
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const payload = (await res.json()) as { schema_version?: unknown } | null;
  if (payload?.schema_version !== expected) {
    throw new SchemaMismatchError(expected, payload?.schema_version);
  }
  return payload as T;
}

/** The worlds a caller may choose between. A directory, never world state. */
export function fetchWorlds(): Promise<Fetched<WorldDirectory>> {
  return getJson<WorldDirectory>(`${apiBase()}/worlds`, PIN.worlds);
}

/**
 * The scene the viewer stands in.
 *
 * Nobody is named: the backend resolves the world's own player from the world record, so whose
 * perception this is stays world truth decided server-side (D-7). A world that states no player
 * answers 404, not a 500, and the caller's not-found surface handles it.
 */
export function fetchScene(world: string): Promise<Fetched<Scene>> {
  return getJson<Scene>(`${apiBase()}/worlds/${encodeURIComponent(world)}/scene/current`, PIN.scene);
}

/**
 * What the viewer has on them. The carrier IS the viewer — the query takes no carrier argument, so
 * this surface cannot be aimed at anyone else (PRD non-goal).
 */
export function fetchCarrying(world: string): Promise<Fetched<Carrying>> {
  return getJson<Carrying>(`${apiBase()}/worlds/${encodeURIComponent(world)}/carrying`, PIN.carrying);
}

/** What the player did: said something, or pressed Continue (which carries no text at all). */
export type Press = "text" | "continue";

/**
 * Submit one beat and hand each frame to `onFrame` as it arrives.
 *
 * SSE-shaped (`data: {json}\n\n`) but over `fetch` rather than `EventSource`, because the beat is a
 * POST and EventSource cannot POST.
 *
 * Two failure regimes, mirroring the server's: anything before the stream opens is an ordinary HTTP
 * status and throws here; once the status line is sent, every later failure arrives as an `error`
 * frame. Callers must handle both. No frame ORDER is assumed — a driver that cannot stream emits the
 * identical frames at the end, so this dispatches whatever arrives in arrival order.
 */
export async function streamBeat(
  world: string,
  press: Press,
  text: string,
  onFrame: (frame: BeatFrame) => void,
): Promise<void> {
  const path = press === "continue" ? "beats/continue" : "beats";
  // `exactOptionalPropertyTypes` is on, so `body: undefined` is not the same as omitting `body`.
  // Continue carries no body at all: an empty chain against an active journey IS the continue press.
  const init: RequestInit =
    press === "continue"
      ? { method: "POST" }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
  const res = await fetch(`${apiBase()}/worlds/${encodeURIComponent(world)}/${path}`, init);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  if (res.body === null) throw new Error("beat stream carried no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Frames are separated by a blank line; a partial tail stays buffered until its terminator
    // arrives, so a frame split across two network reads is never parsed in halves.
    let split = buffer.indexOf("\n\n");
    while (split !== -1) {
      dispatchFrame(buffer.slice(0, split), onFrame);
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf("\n\n");
    }
  }
  dispatchFrame(buffer, onFrame); // a final frame the server did not terminate
}

/** Parse one SSE block and hand its frame over, version-checked like every other payload (D-4). */
function dispatchFrame(block: string, onFrame: (frame: BeatFrame) => void): void {
  const json = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("");
  if (json === "") return;
  const frame = JSON.parse(json) as { schema_version?: unknown };
  if (frame.schema_version !== PIN.beat) {
    throw new SchemaMismatchError(PIN.beat, frame.schema_version);
  }
  onFrame(frame as BeatFrame);
}

/**
 * The URL for one image's bytes: `{apiBase}{path}`, optionally at a tier.
 *
 * Builds the STABLE path the payload carries, never a resolved URL. The backend answers this path
 * with a 302 to a freshly minted presigned URL that expires in minutes, so the redirect target must
 * never be stored, cached or logged — putting one in state gives a picture that works on load and
 * 403s ten minutes later. Handing the browser the stable path lets it follow the redirect and cache
 * the BYTES under the response's own headers, which is the layer allowed to remember them.
 *
 * Always ask for the smallest tier that covers the drawn size: a 64px avatar at `final` spends a
 * megabyte to show a thumbnail.
 */
export function imageUrl(ref: ImageRef, tier?: ImageTier): string {
  const base = `${apiBase()}${ref.path}`;
  return tier ? `${base}?tier=${tier}` : base;
}
