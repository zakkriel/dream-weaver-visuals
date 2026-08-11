import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { loadDirectory, loadScene, loadCarrying, submitBeat, fixtures } from "@/api/load";
import { captureFor, isFixtureMode, resetFixtureMode } from "@/api/fixture-mode";
import {
  apiBase,
  fetchScene,
  hasConfiguredBase,
  imageUrl,
  NOT_FOUND,
  type BeatFrame,
  type Scene,
} from "@/api";

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

  it("a live directory read reports itself as live", async () => {
    respond({ json: fixtures.worlds });
    expect(await loadDirectory()).toMatchObject({ state: "ok", source: "live" });
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
      expect(r).toMatchObject({ state: "ok", source: "fixture" });
      expect(isFixtureMode()).toBe(true);
    }
  });

  it("passes a genuinely empty directory through as live and empty", async () => {
    respond({ json: { schema_version: "world_directory/2", worlds: [] } });
    const r = await loadDirectory();
    expect(r).toMatchObject({ state: "ok", source: "live" });
    expect(r.state === "ok" && r.data.worlds).toEqual([]);
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

/**
 * Where the backend is, and what each environment means.
 *
 * Three environments, one precedence order: an explicit `VITE_API_BASE` wins; otherwise relative
 * paths go through the dev proxy; otherwise there is no backend and the captures serve.
 *
 * The rule that matters most is the last group: **configuring a base takes fixture mode off the
 * table.** Setting it is a statement that a backend exists at that address, so a failure there is a
 * fault to show, not a cue to quietly serve stale captures behind a screen that looks fine.
 */
describe("api base precedence", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is empty by default, so requests are relative and the dev proxy handles them", () => {
    vi.stubEnv("VITE_API_BASE", "");
    expect(apiBase()).toBe("");
    expect(hasConfiguredBase()).toBe(false);
  });

  it("uses the configured origin when one is set", () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    expect(apiBase()).toBe("https://dreamchat.up.railway.app");
    expect(hasConfiguredBase()).toBe(true);
  });

  // This value gets pasted by hand into a settings box.
  it("tolerates a pasted trailing slash and stray whitespace", () => {
    vi.stubEnv("VITE_API_BASE", "  https://dreamchat.up.railway.app///  ");
    expect(apiBase()).toBe("https://dreamchat.up.railway.app");
  });

  it("builds absolute request URLs against the configured origin", async () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    const seen: string[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response(JSON.stringify(fixtures.worlds), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    await loadDirectory();
    expect(seen[0]).toBe("https://dreamchat.up.railway.app/worlds");
  });

  // The image path is the one that would silently break: it is concatenated, not templated.
  it("builds absolute IMAGE urls against the configured origin, with no double slash", () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app/");
    const ref = {
      schema_version: "image_ref/1" as const,
      asset_id: "asset_x",
      path: "/worlds/w1/images/asset_x",
    };
    expect(imageUrl(ref)).toBe("https://dreamchat.up.railway.app/worlds/w1/images/asset_x");
    expect(imageUrl(ref, "thumbnail")).toBe(
      "https://dreamchat.up.railway.app/worlds/w1/images/asset_x?tier=thumbnail",
    );
    expect(imageUrl(ref)).not.toContain("//worlds");
  });

  it("keeps image urls relative when no base is configured", () => {
    vi.stubEnv("VITE_API_BASE", "");
    const ref = {
      schema_version: "image_ref/1" as const,
      asset_id: "asset_x",
      path: "/worlds/w1/images/asset_x",
    };
    expect(imageUrl(ref, "preview")).toBe("/worlds/w1/images/asset_x?tier=preview");
  });
});

describe("a configured base takes fixture mode off the table", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["a 404", { status: 404, body: "<!doctype html>" }],
    ["a 500", { status: 500, body: "boom" }],
    ["an HTML body", { status: 200, body: "<!doctype html>" }],
  ])("reports unreachable rather than degrading on %s", async (_label, init) => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    respond(init);
    const r = await loadDirectory();
    expect(r.state).toBe("unreachable");
    expect(r.state === "unreachable" && r.base).toBe("https://dreamchat.up.railway.app");
    expect(isFixtureMode()).toBe(false);
  });

  it("reports unreachable on a network error and names the base", async () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const r = await loadDirectory();
    expect(r).toMatchObject({ state: "unreachable", base: "https://dreamchat.up.railway.app" });
    expect(isFixtureMode()).toBe(false);
  });

  // The whole point: with Railway configured, the preview must never silently show captures.
  it("a world-scoped read cannot reach fixture mode either", async () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    respond({ status: 404, body: "<!doctype html>" });
    const r = await loadScene(LANTERN, () => fetchScene(LANTERN));
    expect(isFixtureMode()).toBe(false);
    expect(r.state).toBe("missing");
  });

  it("serves live from the configured base when it answers", async () => {
    vi.stubEnv("VITE_API_BASE", "https://dreamchat.up.railway.app");
    respond({ json: fixtures.worlds });
    expect(await loadDirectory()).toMatchObject({ state: "ok", source: "live" });
    expect(isFixtureMode()).toBe(false);
  });

  // And with no base configured, the backendless preview still degrades exactly as before.
  it("with no base configured the same 404 still degrades to captures", async () => {
    vi.stubEnv("VITE_API_BASE", "");
    respond({ status: 404, body: "<!doctype html>" });
    expect(await loadDirectory()).toMatchObject({ state: "ok", source: "fixture" });
    expect(isFixtureMode()).toBe(true);
  });
});
