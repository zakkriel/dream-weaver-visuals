import type { BeatFrame, Carrying, Scene, Transcript, WorldDirectory } from "./index";
import worldDirectory from "@/fixtures/world_directory.json";
import sceneLantern from "@/fixtures/scene_current.json";
import carryingLantern from "@/fixtures/carrying.json";
import beatsLantern from "@/fixtures/beat_stream.json";
import transcriptLantern from "@/fixtures/transcript.json";
import sceneMara from "@/fixtures/scene_current.mara.json";
import carryingMara from "@/fixtures/carrying.mara.json";
import transcriptMara from "@/fixtures/transcript.mara.json";
import beatsMara from "@/fixtures/beat_stream.mara.json";

/**
 * Fixture mode: an ENVIRONMENT state, not a per-request fallback.
 *
 * The Lovable preview has no backend and no dev proxy, so every request to `/worlds/...` hits the
 * app's own router and 404s. Degrading the directory alone got the picker rendering, but pressing
 * Enter then navigated to world-scoped reads that 404'd — and a world-scoped 404 correctly means
 * "that world is not there", so the preview said the world could not be found.
 *
 * Both behaviours were right in isolation. What was missing is that they belong to different
 * questions: *is this world real?* versus *is there a backend at all?* Answering the first when the
 * truth is the second is the whole bug.
 *
 * So the environment is decided ONCE, by the directory read — the only read that can tell the
 * difference, because `/worlds` always exists on a real backend. From then on the answer is sticky:
 *
 *  - **Directory came from the backend → live mode.** Nothing changes. Every world-scoped 404 keeps
 *    its exact meaning. Fixture mode is unreachable, by construction: the only thing that can enter
 *    it is a failed directory read, and a successful one leaves it.
 *  - **Directory came from the capture → fixture mode.** World-scoped reads for world ids we hold a
 *    capture for are served from that capture, so the preview is fully drivable.
 *
 * An id we hold no capture for still renders honest not-found, in either mode. Fixture mode makes the
 * captured worlds work; it does not make every id exist.
 */

/**
 * Tri-state on purpose.
 *
 * `undetermined` is not a detail — it is the state every cold page load starts in. A deep link
 * straight to `/w/<id>/play`, or a refresh, boots a fresh JS module graph with no memory of what the
 * picker learned. If "not yet determined" collapsed into "live", that entry point would read a 404
 * as "this world is not there" all over again, which is the exact bug this file exists to prevent.
 *
 * So a world-scoped read never guesses: it waits for the environment to be established first, and
 * the directory read is what establishes it.
 */
type Environment = "undetermined" | "live" | "fixture";

let environment: Environment = "undetermined";
let pending: Promise<void> | null = null;

/** Called by the directory read, and by nothing else. */
export function setFixtureMode(on: boolean): void {
  const next: Environment = on ? "fixture" : "live";
  if (environment !== next && import.meta.env.DEV) {
    console.warn(
      on
        ? "[dreamchat] fixture mode ON — no backend reachable. Captured payloads will serve every " +
            "world we hold a capture for. Against a real backend this should never happen."
        : "[dreamchat] fixture mode OFF — live directory loaded.",
    );
  }
  environment = next;
}

export function isFixtureMode(): boolean {
  return environment === "fixture";
}

export function isEnvironmentKnown(): boolean {
  return environment !== "undetermined";
}

/**
 * Establish the environment if nothing has yet, and never more than once concurrently.
 *
 * `establish` is injected rather than imported so this module stays free of the transport — the
 * directory read lives in `load.ts` and would otherwise import back into here.
 */
export function ensureEnvironment(establish: () => Promise<unknown>): Promise<void> {
  if (environment !== "undetermined") return Promise.resolve();
  pending ??= establish().then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

/** Test-only reset, so one test's environment cannot leak into the next. */
export function resetFixtureMode(): void {
  environment = "undetermined";
  pending = null;
}

/** Everything we hold offline for one world. */
export interface WorldCapture {
  scene: Scene;
  carrying: Carrying;
  beats: BeatFrame[];
  /**
   * The world's stored story as it stood when the capture was taken.
   *
   * A record, so unlike the other three it cannot be recomputed — which is exactly why it is worth
   * holding offline. The Mara world's capture is genuinely EMPTY, and that is the more useful of the
   * two fixtures: it is what a world looks like before anything has been played in it.
   */
  transcript: Transcript;
}

/**
 * The captures, keyed by the world they were taken from.
 *
 * Keyed deliberately: serving The Drowned Lantern's scene under another world's id would be
 * fabricating that world's content, which is the one thing a fallback must never do. A world with no
 * entry here is simply not drivable offline, and says so honestly.
 */
const CAPTURES: Record<string, WorldCapture> = {
  "22222222-2222-2222-2222-222222222222": {
    scene: sceneLantern as unknown as Scene,
    carrying: carryingLantern as unknown as Carrying,
    beats: beatsLantern as unknown as BeatFrame[],
    transcript: transcriptLantern as unknown as Transcript,
  },
  "11111111-1111-1111-1111-111111111111": {
    scene: sceneMara as unknown as Scene,
    carrying: carryingMara as unknown as Carrying,
    beats: beatsMara as unknown as BeatFrame[],
    transcript: transcriptMara as unknown as Transcript,
  },
};

export const fixtureDirectory = worldDirectory as unknown as WorldDirectory;

/** The capture for one world, or nothing if we hold none. */
export function captureFor(worldId: string): WorldCapture | undefined {
  return CAPTURES[worldId];
}

/** Says out loud, in dev only, that a read was served from a capture. */
export function noteFixtureServe(what: string, worldId: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[dreamchat] fixture mode: served ${what} for ${worldId} from a bundled capture.`);
  }
}
