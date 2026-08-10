import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { loadDirectory, loadOrFixture, fixtures } from "@/api/load";
import { fetchScene, NOT_FOUND, type Scene } from "@/api";

/**
 * The degradation matrix.
 *
 * This exists because getting one cell of it wrong put "No worlds to enter." on the founder's screen
 * in the Lovable preview: `GET /worlds` 404s on an origin with no dev proxy, the directory read
 * treated that 404 as an answer, and the empty state rendered over a perfectly good bundled capture.
 *
 * The distinction the table encodes: **the directory is not world-scoped.** `/worlds` always exists
 * on a real backend and answers `200` with `worlds: []` when it is empty, so a 404 there is an
 * environment fact, not an answer. A 404 on a world-scoped read IS an answer and must survive.
 */

const ORIGINAL_FETCH = globalThis.fetch;

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

beforeEach(() => {
  // The degrade note is dev-only and deliberately noisy; keep the suite readable.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("loadDirectory always yields a directory", () => {
  it("returns live data when the backend answers correctly", async () => {
    respond({ json: fixtures.worlds });
    const r = await loadDirectory();
    expect(r.source).toBe("live");
    expect(r.data.worlds.length).toBeGreaterThan(0);
  });

  // The regression. An origin with no dev proxy — the Lovable preview — 404s /worlds.
  it("degrades to the capture on 404, because /worlds 404 means 'no backend', not 'no worlds'", async () => {
    respond({ status: 404, body: "<!doctype html><title>Not found</title>" });
    const r = await loadDirectory();
    expect(r.source).toBe("fixture");
    expect(r.data.worlds.length).toBeGreaterThan(0);
  });

  it("degrades on an HTML body served with a 200 (a SPA catch-all route)", async () => {
    respond({ status: 200, body: "<!doctype html><title>App</title>" });
    const r = await loadDirectory();
    expect(r.source).toBe("fixture");
    expect(r.data.worlds.length).toBeGreaterThan(0);
  });

  it("degrades on a non-2xx", async () => {
    respond({ status: 500, body: "boom" });
    expect((await loadDirectory()).source).toBe("fixture");
  });

  it("degrades on a network error", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect((await loadDirectory()).source).toBe("fixture");
  });

  // Loud in dev, never silent — and verify:contract is the gate that actually catches real drift.
  it("degrades on a schema-pin failure and says why", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    respond({ json: { ...fixtures.worlds, schema_version: "world_directory/99" } });
    const r = await loadDirectory();
    expect(r.source).toBe("fixture");
    if (import.meta.env.DEV) {
      expect(warn.mock.calls.flat().join(" ")).toMatch(/world_directory\/99|contract moved/);
    }
  });

  it("passes a genuinely empty directory through as live and empty", async () => {
    respond({ json: { schema_version: "world_directory/2", worlds: [] } });
    const r = await loadDirectory();
    expect(r.source).toBe("live");
    expect(r.data.worlds).toEqual([]);
  });
});

describe("world-scoped reads keep 404 meaningful", () => {
  it("a 404 stays missing and does NOT become somebody else's fixture world", async () => {
    respond({ status: 404, body: "" });
    const r = await loadOrFixture(() => fetchScene("nope"), fixtures.scene as unknown as Scene);
    expect(r.state).toBe("missing");
  });

  it("a network error still degrades to the capture", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const r = await loadOrFixture(() => fetchScene("w"), fixtures.scene as unknown as Scene);
    expect(r).toMatchObject({ state: "ok", source: "fixture" });
  });

  it("a schema-pin failure is reported, not hidden behind a stale capture", async () => {
    respond({ json: { ...(fixtures.scene as object), schema_version: "scene_current/99" } });
    const r = await loadOrFixture(() => fetchScene("w"), fixtures.scene as unknown as Scene);
    expect(r.state).toBe("failed");
  });

  it("NOT_FOUND is the sentinel the transport actually returns for 404", async () => {
    respond({ status: 404, body: "" });
    await expect(fetchScene("w")).resolves.toBe(NOT_FOUND);
  });
});
