import {
  NOT_FOUND,
  fetchWorlds,
  apiBase,
  hasConfiguredBase,
  streamBeat,
  type BeatFrame,
  type Carrying,
  type Fetched,
  type Scene,
  type WorldDirectory,
} from "./index";
import {
  NO_HISTORY,
  fetchHistory,
  toPage,
  type Cursor,
  type FetchedPage,
} from "./history";
import {
  captureFor,
  fixtureDirectory,
  type WorldCapture,
  isFixtureMode,
  ensureEnvironment,
  noteFixtureServe,
  setFixtureMode,
} from "./fixture-mode";

/**
 * How a surface got its data. Surfaces render this, because a reader looking at captured data in the
 * Lovable preview must not mistake it for the world.
 */
export type Source = "live" | "fixture";

/**
 * What a directory read yields.
 *
 * `unreachable` exists only for the configured-base case and names the base, because the thing the
 * operator most needs to know is which address failed — a pasted URL with a typo looks identical to
 * a backend that is down until you can see the origin the app actually tried.
 */
export type DirectoryResult =
  | { state: "ok"; data: WorldDirectory; source: Source }
  | { state: "unreachable"; base: string; why: string };

export type Loaded<T> =
  | { state: "ok"; data: T; source: Source }
  | { state: "missing" }
  | { state: "failed" };

/** Says out loud, in dev only, that a surface fell back — so a real drift is never silent. */
function noteDegrade(what: string, why: string): void {
  if (import.meta.env.DEV) {
    console.warn(
      `[dreamchat] ${what}: falling back to the bundled capture — ${why}. ` +
        `This is expected in the Lovable preview, where there is no backend. ` +
        `Against a real backend it means something is wrong.`,
    );
  }
}

/**
 * Read the world directory. **This one always succeeds, and it decides the environment.**
 *
 * The directory is different in kind from every other read: `GET /worlds` always exists on a real
 * backend, and an empty directory answers `200` with `worlds: []` rather than 404. So a 404 here does
 * not mean "there are no worlds" — it means this origin is not talking to a backend at all.
 *
 * Every way of failing to obtain a valid pinned directory therefore degrades to the capture: network
 * error, any non-2xx including 404, a non-JSON body (the preview's HTML catch-all), and a schema-pin
 * failure. Each logs in dev, so real drift is loud — and `verify:contract` in CI is the gate that
 * actually catches drift.
 *
 * It is also the ONLY thing that sets fixture mode, in either direction. A successful live read turns
 * it off, which is what makes fixture mode unreachable against a real backend.
 *
 * The return type has no failure case on purpose: the capture is a bundled import, so there is no
 * runtime path where this yields nothing, and callers should not carry a dead branch.
 */
export async function loadDirectory(): Promise<DirectoryResult> {
  // A configured base is a statement that a backend exists at that address. If it cannot be reached,
  // that is a fault the operator needs to see — serving stale captures would hide a broken deployment
  // behind a screen that looks like it works. So fixture mode is off the table here, by precedence.
  const configured = hasConfiguredBase();

  const degradeOrFail = (why: string): DirectoryResult => {
    if (configured) {
      setFixtureMode(false);
      return { state: "unreachable", base: apiBase(), why };
    }
    noteDegrade("world directory", why);
    setFixtureMode(true);
    return { state: "ok", data: fixtureDirectory, source: "fixture" };
  };

  try {
    const result = await fetchWorlds();
    if (result === NOT_FOUND) {
      return degradeOrFail("the endpoint answered 404, so this origin has no backend");
    }
    setFixtureMode(false);
    return { state: "ok", data: result, source: "live" };
  } catch (err) {
    if (err instanceof Error && err.name === "SchemaMismatchError") {
      return degradeOrFail(`${err.message} — the contract moved; check verify:contract`);
    }
    return degradeOrFail(err instanceof Error ? err.message : "the read failed");
  }
}

/**
 * Read a WORLD-SCOPED payload: the scene, what is carried, anything hung off one world id.
 *
 * **In live mode nothing here has changed.** A 404 is passed through as `missing`, because for a
 * world-scoped read a 404 is a real answer to a real question — that world, that scene does not exist
 * for this viewer — and showing another world's capture instead would be a lie (B-1, I-3). A schema
 * mismatch is reported as `failed`, because a stale capture would hide the breakage the pin exists to
 * surface.
 *
 * **In fixture mode** the environment has already been established as backendless by the directory
 * read, so a 404 carries no information about the world and the capture is served instead — but only
 * for a world we actually hold one for. An id with no capture still renders honest not-found.
 */
export async function loadWorldScoped<T>(
  worldId: string,
  read: () => Promise<Fetched<T>>,
  fromCapture: (c: WorldCapture) => T,
  label: string,
): Promise<Loaded<T>> {
  // Establish the environment before reading anything world-scoped. A cold load — a deep link, a
  // refresh — starts with no memory of what the picker learned, and a 404 means something different
  // in each environment. Cheap: the directory read is memoised, so this costs one request per page
  // load and nothing on subsequent reads.
  await ensureEnvironment(loadDirectory);

  if (isFixtureMode()) {
    const capture = captureFor(worldId);
    // Not a world we captured. In a backendless preview that is all we can honestly say.
    if (!capture) return { state: "missing" };
    noteFixtureServe(label, worldId);
    return { state: "ok", data: fromCapture(capture), source: "fixture" };
  }

  try {
    const result = await read();
    if (result === NOT_FOUND) return { state: "missing" };
    return { state: "ok", data: result, source: "live" };
  } catch (err) {
    if (err instanceof Error && err.name === "SchemaMismatchError") return { state: "failed" };
    noteDegrade(label, err instanceof Error ? err.message : "the read failed");
    // A live-mode transport failure is not an environment change: the directory decides that, and it
    // already said there is a backend. Serve the capture for this read only if we hold one.
    const capture = captureFor(worldId);
    if (!capture) return { state: "failed" };
    return { state: "ok", data: fromCapture(capture), source: "fixture" };
  }
}

/**
 * Read a page of the world's story, respecting the environment the directory established.
 *
 * Two departures from every other world-scoped read, both because this one is a RECORD:
 *
 * - **Offline it serves the whole capture as a single page.** There is nothing to paginate against,
 *   and the capture is what was there when it was taken. The Mara world's capture is empty, which is
 *   exactly what a world looks like before anything has been played in it.
 * - **A live failure NEVER falls back to the capture.** For a scene, a stale capture is a slightly
 *   old view of a place that still exists. For a story it is a different story — words this viewer
 *   may never have been told, presented as their own memory. Better to say the read failed.
 */
export async function loadHistory(
  worldId: string,
  halt: (reason: string) => string,
  before?: Cursor,
): Promise<FetchedPage> {
  await ensureEnvironment(loadDirectory);

  if (isFixtureMode()) {
    const capture = captureFor(worldId);
    if (!capture) return NO_HISTORY;
    noteFixtureServe("transcript", worldId);
    return toPage(capture.transcript, halt);
  }

  return fetchHistory(worldId, halt, before);
}

export const loadScene = (worldId: string, read: () => Promise<Fetched<Scene>>) =>
  loadWorldScoped(worldId, read, (c) => c.scene, "scene");

export const loadCarrying = (worldId: string, read: () => Promise<Fetched<Carrying>>) =>
  loadWorldScoped(worldId, read, (c) => c.carrying, "carrying");

/**
 * Submit a beat, or play one back.
 *
 * In fixture mode there is nothing to submit to, so the bundled stream is replayed frame by frame —
 * same shapes, same order, same handler. That is what makes the play surface drivable in the preview,
 * which is the entire point: a design tool has to be able to SEE a surface to design it.
 *
 * The small delay between frames is not decoration either. Streaming granularity is a real property
 * of this surface — the pending state, the transcript growing a line at a time — and a replay that
 * dumped every frame at once would hide the thing a designer most needs to look at.
 */
export async function submitBeat(
  worldId: string,
  text: string,
  onFrame: (frame: BeatFrame) => void,
): Promise<void> {
  await ensureEnvironment(loadDirectory);
  if (isFixtureMode()) {
    const capture = captureFor(worldId);
    if (!capture) throw new Error("no captured beat stream for this world");
    noteFixtureServe("beat stream", worldId);
    for (const frame of capture.beats) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 120);
      await promise;
      onFrame(frame);
    }
    return;
  }
  return streamBeat(worldId, text, onFrame);
}

/** The bundled captures, for callers that need one directly. */
export const fixtures = {
  worlds: fixtureDirectory,
} as const;
