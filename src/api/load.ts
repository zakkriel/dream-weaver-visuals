import { NOT_FOUND, type Fetched } from "./index";
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

/**
 * Read live, and fall back to the bundled capture when live is not reachable.
 *
 * The fallback exists for exactly one reason: **the Lovable preview has no backend.** Design work
 * happens in an editor with no `:8080` and no proxy, and a design tool staring at a blank error page
 * cannot iterate. So an unreachable backend degrades to the real captured payload rather than to
 * nothing — and the surface says which it is showing.
 *
 * What it deliberately does NOT do:
 *  - It never falls back on **404**. A world that does not exist must read as not-found, not as
 *    somebody else's fixture world. `NOT_FOUND` is passed straight through (B-1, I-3).
 *  - It never falls back on a **schema mismatch**. A pin failure means the contract moved underneath
 *    us; showing a stale fixture would hide exactly the breakage the pin exists to surface. It is a
 *    transport failure and it is reported as one.
 *
 * So the only path to a fixture is a genuine network failure — which in practice means the preview,
 * or a developer with the stack down.
 */
export async function loadOrFixture<T>(
  read: () => Promise<Fetched<T>>,
  fixture: T,
): Promise<Loaded<T>> {
  try {
    const result = await read();
    if (result === NOT_FOUND) return { state: "missing" };
    return { state: "ok", data: result, source: "live" };
  } catch (err) {
    // A pin failure is not an offline condition — surface it rather than papering over it.
    if (err instanceof Error && err.name === "SchemaMismatchError") return { state: "failed" };
    return { state: "ok", data: fixture, source: "fixture" };
  }
}

/**
 * The bundled captures, typed only at the point of use.
 *
 * These are real payloads captured from a live backend, so they are correct by construction rather
 * than by assertion — but they are still JSON imports, so each cast is the one place a fixture
 * crosses into typed code. `verify:types` guarantees the type side; the fixture side is guarded by
 * `src/laws/fixtures.test.ts`, which fails if a fixture's `schema_version` stops matching its pin.
 */
export const fixtures = {
  worlds: worldDirectoryFixture,
  scene: sceneFixture,
  carrying: carryingFixture,
} as const;
