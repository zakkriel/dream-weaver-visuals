import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { loadDirectory, loadScene, loadCarrying, submitBeat, fixtures } from "@/api/load";
import { captureFor, isFixtureMode, resetFixtureMode } from "@/api/fixture-mode";
import { fetchScene, NOT_FOUND, type BeatFrame, type Scene } from "@/api";

/**
 * The degradation matrix, and the environment that decides it.
 *
 * Two bugs live in this file's history, both from answering the wrong question:
 *
 *  1. `GET /worlds` 404s on an origin with no dev proxy. Treating that as an answer rendered
 *     "No worlds to enter." over a perfectly good capture.
 *  2. With the directory fixed, Enter then navigated to world-scoped reads that also 404'd — and a
 *     world-scoped 404 correctly means "that world is not there", so the preview said the world could
 *     not be found.
 *
 * Both behaviours were right in isolation. What was missing is that "is this world real?" and "is
 * there a backend at all?" are different questions, and only the directory read can answer the
 * second. So the environment is decided once and is sticky from then on.
 */

const ORIGINAL_FETCH = globalThis.fetch;
const LANTERN = "22222222-2222-2222-2222-222222222222";
const MARA = "11111111-1111-1111-1111-111111111111";
const UNKNOWN = "99999999-9999-9999-9999-999999999999";

function respond(init: { status?: number; body?: string; json?: unknown }) {
  const body = init.json !== undefined ? JSON.stringify(init.json) : (init.body ?? "");
  globalThis.fetch = vi.fn(
    async () =>
      new Response(body, {
        status: init.status ?? 200,
        headers: { "Content-Type": init.json !== undefined ? "application/json" : "text/html" },
      }),
  ) as unknown as typeof fetch;
}

/** Put the app in the state the Lovable preview produces: no backend anywhere. */
async function enterBackendlessPreview() {
  respond({ status: 404, body: "<!doctype html>" });
  await loadDirectory();
}

/** Put the app in the state a real backend produces. */
async function enterLive() {
  respond({ json: fixtures.worlds });
  await loadDirectory();
}

beforeEach(() => {
  resetFixtureMode();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  resetFixtureMode();
  vi.restoreAllMocks();
});

describe("the directory decides the environment", () => {
  it("a live directory means live mode", async () => {
    await enterLive();
    expect(isFixtureMode()).toBe(false);
  });

  it("a 404 directory means fixture mode", async () => {
    await enterBackendlessPreview();
    expect(isFixtureMode()).toBe(true);
  });

  it("fixture mode is sticky — it survives until a live directory turns it off", async () => {
    await enterBackendlessPreview();
    expect(isFixtureMode()).toBe(true);
    // Any number of world-scoped reads later, still fixture mode.
    await loadScene(LANTERN, () => fetchScene(LANTERN));
    await loadCarrying(LANTERN, () => fetchScene(LANTERN) as never);
    expect(isFixtureMode()).toBe(true);

    await enterLive();
    expect(isFixtureMode()).toBe(false);
  });

  it("degrades on every way of failing to read the directory", async () => {
    for (const init of [
      { status: 404, body: "<!doctype html>" },
      { status: 200, body: "<!doctype html>" },
      { status: 500, body: "boom" },
      { json: { schema_version: "world_directory/99", worlds: [] } },
    ]) {
      resetFixtureMode();
      respond(init);
      const r = await loadDirectory();
      expect(r.source).toBe("fixture");
      expect(isFixtureMode()).toBe(true);
    }
  });

  it("passes a genuinely empty directory through as live and empty", async () => {
    respond({ json: { schema_version: "world_directory/2", worlds: [] } });
    const r = await loadDirectory();
    expect(r.source).toBe("live");
    expect(r.data.worlds).toEqual([]);
    expect(isFixtureMode()).toBe(false);
  });
});

describe("fixture mode serves the worlds we captured, and only those", () => {
  it("serves the scene for a captured world without touching the network", async () => {
    await enterBackendlessPreview();
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(r).toMatchObject({ state: "ok", source: "fixture" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("serves each captured world its OWN scene, never another world's", async () => {
    await enterBackendlessPreview();
    const lantern = await loadScene(LANTERN, () => fetchScene(LANTERN));
    const mara = await loadScene(MARA, () => fetchScene(MARA));
    expect(lantern.state).toBe("ok");
    expect(mara.state).toBe("ok");
    const a = lantern.state === "ok" ? lantern.data.place.label : null;
    const b = mara.state === "ok" ? mara.data.place.label : null;
    expect(a).not.toBe(b);
  });

  // Fixture mode makes the captured worlds work. It does not make every id exist.
  it("an id we hold no capture for is still honestly not-found", async () => {
    await enterBackendlessPreview();
    const r = await loadScene(UNKNOWN, () => fetchScene(UNKNOWN));
    expect(r.state).toBe("missing");
  });

  it("replays the captured beat stream so the play surface is drivable", async () => {
    await enterBackendlessPreview();
    const frames: BeatFrame[] = [];
    await submitBeat(LANTERN, "text", "I look around", (f) => frames.push(f));
    expect(frames.length).toBeGreaterThan(0);
    expect(frames).toEqual(captureFor(LANTERN)?.beats);
  });

  it("has no beat stream to replay for an uncaptured world", async () => {
    await enterBackendlessPreview();
    await expect(submitBeat(UNKNOWN, "text", "x", () => {})).rejects.toThrow();
  });
});

describe("live mode is completely unaffected", () => {
  it("a world-scoped 404 still means missing — never another world's capture", async () => {
    await enterLive();
    respond({ status: 404, body: "" });
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(r.state).toBe("missing");
  });

  it("a schema-pin failure is reported, not hidden behind a stale capture", async () => {
    await enterLive();
    respond({ json: { schema_version: "scene_current/99" } });
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(r.state).toBe("failed");
  });

  it("a live read is served live", async () => {
    await enterLive();
    const scene = captureFor(LANTERN)!.scene;
    respond({ json: scene });
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(r).toMatchObject({ state: "ok", source: "live" });
  });

  it("a beat in live mode goes to the network, not the capture", async () => {
    await enterLive();
    const spy = vi.fn(async () => new Response("", { status: 500 }));
    globalThis.fetch = spy as unknown as typeof fetch;
    await expect(submitBeat(LANTERN, "text", "x", () => {})).rejects.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  // The guarantee that matters most: nothing but a failed directory read can turn fixture mode on.
  it("fixture mode is unreachable while the directory loads", async () => {
    await enterLive();
    respond({ status: 404, body: "" });
    await loadScene(LANTERN, () => fetchScene(LANTERN));
    await loadCarrying(LANTERN, () => fetchScene(LANTERN) as never);
    expect(isFixtureMode()).toBe(false);
  });

  it("NOT_FOUND is the sentinel the transport actually returns for 404", async () => {
    respond({ status: 404, body: "" });
    await expect(fetchScene("w")).resolves.toBe(NOT_FOUND);
  });

  it("a live transport failure serves this read from the capture without changing the mode", async () => {
    await enterLive();
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const r: Awaited<ReturnType<typeof loadScene>> = await loadScene(LANTERN, () =>
      fetchScene(LANTERN),
    );
    expect(r).toMatchObject({ state: "ok", source: "fixture" });
    expect(isFixtureMode()).toBe(false);
  });
});

describe("the captures themselves", () => {
  it("every captured world is listed in the fixture directory", () => {
    for (const w of fixtures.worlds.worlds) expect(captureFor(w.id)).toBeDefined();
  });

  it("each capture's scene and carrying belong to that world", () => {
    for (const w of fixtures.worlds.worlds) {
      const c = captureFor(w.id)!;
      expect(c.carrying.world_id).toBe(w.id);
      expect((c.scene as Scene).place.label.length).toBeGreaterThan(0);
    }
  });
});

/**
 * The cold-load case: a deep link or a refresh boots a fresh module graph with no memory of what the
 * picker learned. This is what made the first version of sticky mode insufficient — client-side
 * navigation kept the state, a hard load lost it, and the play surface said "Not found" again.
 */
describe("a cold load establishes the environment for itself", () => {
  it("a world-scoped read with no prior directory read resolves the environment first", async () => {
    // Nothing has run: environment is undetermined, exactly as after a refresh.
    expect(isFixtureMode()).toBe(false);
    respond({ status: 404, body: "<!doctype html>" });
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(isFixtureMode()).toBe(true);
    expect(r).toMatchObject({ state: "ok", source: "fixture" });
  });

  it("the same cold load against a live backend reads live and stays live", async () => {
    const scene = captureFor(LANTERN)!.scene;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.endsWith("/worlds") ? fixtures.worlds : scene;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(isFixtureMode()).toBe(false);
    expect(r).toMatchObject({ state: "ok", source: "live" });
  });

  it("establishes the environment once, not once per read", async () => {
    const spy = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/worlds")
        ? new Response(JSON.stringify(fixtures.worlds), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        : new Response("", { status: 404 }),
    );
    globalThis.fetch = spy as unknown as typeof fetch;
    await Promise.all([
      loadScene(LANTERN, () => fetchScene(LANTERN)),
      loadScene(LANTERN, () => fetchScene(LANTERN)),
      loadScene(LANTERN, () => fetchScene(LANTERN)),
    ]);
    const directoryReads = spy.mock.calls.filter(([u]) => String(u).endsWith("/worlds")).length;
    expect(directoryReads).toBe(1);
  });
});
