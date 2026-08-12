import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The bundled fixtures are the app's offline fallback, so a stale one is worse than none: it renders
 * as if it were real while describing a contract that has moved. These pin each capture to the
 * version the transport layer asks for, and pin the pins themselves to the vendored schemas.
 */

const PINS: Record<string, string> = {
  "world_directory.json": "world_directory/2",
  "scene_current.json": "scene_current/3",
  "carrying.json": "carrying/1",
  "carrying.mara.json": "carrying/1",
  "scene_current.mara.json": "scene_current/3",
  "transcript.json": "transcript/1",
  "transcript.mara.json": "transcript/1",
};

const SCHEMA_OF: Record<string, string> = {
  "world_directory/2": "contracts/world_directory.v2.schema.json",
  "scene_current/3": "contracts/scene_current.v3.schema.json",
  "beat_frame/4": "contracts/beat_frame.v4.schema.json",
  "transcript/1": "contracts/transcript.v1.schema.json",
  "narration/2": "contracts/narration.v2.schema.json",
  "carrying/1": "contracts/carrying.v1.schema.json",
};

function fixture(name: string): { schema_version?: string } {
  return JSON.parse(readFileSync(join("src/fixtures", name), "utf8")) as { schema_version?: string };
}

describe("fixtures carry the version the client pins", () => {
  it.each(Object.entries(PINS))("%s is %s", (name, pin) => {
    expect(fixture(name).schema_version).toBe(pin);
  });

  it.each(["beat_stream.json", "beat_stream.mara.json"])(
    "every beat frame in %s is the pinned version",
    (name) => {
      const frames = JSON.parse(readFileSync(join("src/fixtures", name), "utf8")) as {
        schema_version?: string;
      }[];
      expect(frames.length).toBeGreaterThan(0);
      for (const f of frames) expect(f.schema_version).toBe("beat_frame/4");
    },
  );

  it("a transcript capture is a real capture, not a hand-written story", () => {
    // The one fixture that is a RECORD. If it were ever authored by hand it would be fiction
    // presented to a reader as their own memory, which is the worst thing this repo can render.
    const record = JSON.parse(readFileSync("src/fixtures/transcript.json", "utf8")) as {
      world_id?: string;
      entries?: { entry_no?: number; segments?: { speaker_label?: string }[] }[];
    };
    expect(record.world_id).toBe("22222222-2222-2222-2222-222222222222");
    expect(record.entries?.length).toBeGreaterThan(0);
    // Monotonic entry_no, newest first — the ordering the cursor depends on.
    const nos = (record.entries ?? []).map((e) => e.entry_no ?? 0);
    expect(nos).toEqual([...nos].sort((a, b) => b - a));
  });
});

describe("every pinned version has a vendored schema behind it", () => {
  it.each(Object.entries(SCHEMA_OF))("%s -> %s declares that $id", (pin, path) => {
    const schema = JSON.parse(readFileSync(path, "utf8")) as { $id?: string };
    expect(schema.$id).toBe(pin);
  });
});

/**
 * The mock that is not a capture.
 *
 * `dashboard.mock.json` was hand-authored by the design tool and matches no contract. It has been
 * moved out of `src/fixtures/` precisely because sitting beside real captures made it
 * indistinguishable from one. This keeps it out.
 */
describe("src/fixtures holds captured payloads only", () => {
  it("every fixture declares a schema_version", () => {
    const files = readdirSync("src/fixtures").filter((f) => f.endsWith(".json"));
    const undeclared = files.filter((f) => {
      const parsed: unknown = JSON.parse(readFileSync(join("src/fixtures", f), "utf8"));
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items.some(
        (x) => typeof (x as { schema_version?: unknown }).schema_version !== "string",
      );
    });
    expect(undeclared).toEqual([]);
  });
});
