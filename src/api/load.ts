import { NOT_FOUND, fetchWorlds, type Fetched, type WorldDirectory } from "./index";
import worldDirectoryFixture from "@/fixtures/world_directory.json";
import sceneFixture from "@/fixtures/scene_current.json";
import carryingFixture from "@/fixtures/carrying.json";

/**
 * How a surface got its data. Surfaces render this, because a reader looking at fixture data in the
 * Lovable preview must not mistake it for the world.
 */
export type Source = "live" | "fixture";

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
 * Read a WORLD-SCOPED payload live, falling back to the bundled capture when live is unreachable.
 *
 * 404 is passed through as `missing` here **on purpose**: for a world-scoped read, a 404 is a real
 * answer about a real question — that world, that scene, that carrying does not exist for this
 * viewer — and showing somebody else's fixture world instead would be a lie (B-1, I-3).
 *
 * A schema mismatch is reported as `failed` for the same reason: the contract moved underneath us and
 * a stale capture would hide exactly the breakage the pin exists to surface.
 *
 * ⚠️ Do NOT use this for the world directory. See `loadDirectory`.
 */
export async function loadOrFixture<T>(
  read: () => Promise<Fetched<T>>,
  fixture: T,
  label = "surface",
): Promise<Loaded<T>> {
  try {
    const result = await read();
    if (result === NOT_FOUND) return { state: "missing" };
    return { state: "ok", data: result, source: "live" };
  } catch (err) {
    if (err instanceof Error && err.name === "SchemaMismatchError") return { state: "failed" };
    noteDegrade(label, err instanceof Error ? err.message : "the read failed");
    return { state: "ok", data: fixture, source: "fixture" };
  }
}

/**
 * Read the world directory. **This one always succeeds.**
 *
 * The directory is different in kind from every other read, and getting that wrong is what put
 * "No worlds to enter." on the founder's screen:
 *
 *  - `GET /worlds` **always exists on a real backend.** A directory with nothing in it answers `200`
 *    with `worlds: []`; it never answers 404.
 *  - So a **404 on `/worlds` does not mean "there are no worlds"** — it means this origin is not
 *    talking to a DreamChat backend at all. In the Lovable preview there is no dev proxy, so
 *    `/worlds` hits the app's own router and 404s. Treating that as an answer rendered the empty
 *    state over a perfectly good bundled capture.
 *
 * Therefore **every** way of failing to obtain a valid pinned directory degrades to the capture:
 * a network error, any non-2xx including 404, a non-JSON body (the preview's HTML catch-all), and a
 * schema-pin failure. Each one logs in dev, so a real drift is loud rather than silent — and
 * `verify:contract` in CI is the gate that actually catches drift.
 *
 * The return type has no failure case on purpose: the fixture is a bundled import, so there is no
 * runtime path where this yields nothing, and callers should not carry a dead branch pretending
 * otherwise. An empty picker is now reachable only from a genuine `worlds: []`.
 */
export async function loadDirectory(): Promise<{ data: WorldDirectory; source: Source }> {
  try {
    const result = await fetchWorlds();
    if (result === NOT_FOUND) {
      noteDegrade("world directory", "the endpoint answered 404, so this origin has no backend");
      return { data: fixtures.worlds as WorldDirectory, source: "fixture" };
    }
    return { data: result, source: "live" };
  } catch (err) {
    const why =
      err instanceof Error && err.name === "SchemaMismatchError"
        ? `${err.message} — the contract moved; check verify:contract`
        : err instanceof Error
          ? err.message
          : "the read failed";
    noteDegrade("world directory", why);
    return { data: fixtures.worlds as WorldDirectory, source: "fixture" };
  }
}

/**
 * The bundled captures.
 *
 * Real payloads captured from a live backend, so they are correct by construction rather than by
 * assertion — but they are still JSON imports, so each cast is the one place a fixture crosses into
 * typed code. `src/laws/fixtures.test.ts` fails if a capture's `schema_version` stops matching its pin.
 */
export const fixtures = {
  worlds: worldDirectoryFixture,
  scene: sceneFixture,
  carrying: carryingFixture,
} as const;
