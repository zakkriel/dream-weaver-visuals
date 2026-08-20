import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { serializeArtStyle } from "@/api/genesis";

/**
 * The law tests.
 *
 * These do not test appearance. They test the rules in `docs/handoff/README.md` §3 — the ones that
 * exist because breaking them leaks what a character has not earned, or states something the world
 * never said. Lovable owns every pixel; these are the fence around that freedom, and they are the
 * reason a design tool can push to `main` without a human reading every diff.
 *
 * If a restyle turns one of these red, the restyle has almost certainly broken a rule. The test is
 * right until proven otherwise.
 */

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.(tsx|ts)$/.test(p) && !/\.test\.tsx?$/.test(p) ? [p] : [];
  });
}

/** Everything the app ships, excluding generated types and the vendored shadcn primitives. */
const APP = sourceFiles("src").filter(
  (f) =>
    !f.startsWith(join("src", "api", "types")) && !f.startsWith(join("src", "components", "ui")),
);

/** Only what a route can actually reach. Unrouted components cannot violate anything on screen. */
function reachableFrom(entry: string[], seen = new Set<string>()): Set<string> {
  for (const file of entry) {
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const spec of src.matchAll(/from\s+"(@\/[^"]+)"/g)) {
      const rel = spec[1]!.replace("@/", "src/");
      for (const cand of [
        `${rel}.tsx`,
        `${rel}.ts`,
        join(rel, "index.tsx"),
        join(rel, "index.ts"),
      ]) {
        if (existsSync(cand)) {
          reachableFrom([cand], seen);
          break;
        }
      }
    }
  }
  return seen;
}

const ROUTES = sourceFiles("src/routes");
const MOUNTED = [...reachableFrom(ROUTES)].filter(
  (f) =>
    !f.startsWith(join("src", "components", "ui")) && !f.startsWith(join("src", "api", "types")),
);

/**
 * Source with comments removed.
 *
 * These rules scan text, and a doc comment explaining WHY something is banned would otherwise trip
 * the ban that documents it — the note recording that a rail used to ship `href="#"` placeholders
 * failed the dead-link rule. A comment cannot render, so it cannot violate anything on screen; only
 * code counts.
 *
 * Line comments are only stripped when they start a line, so a `https://` inside a string survives.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

function read(files: string[]): { file: string; src: string }[] {
  return files.map((file) => ({ file, src: stripComments(readFileSync(file, "utf8")) }));
}

describe("law: the mounted app is the only thing that can break a rule", () => {
  it("every route is reachable and at least the picker is mounted", () => {
    expect(ROUTES.length).toBeGreaterThan(0);
    expect(MOUNTED.some((f) => f.includes("WorldCard"))).toBe(true);
  });
});

// Rule 4 [B-5]. Ticks order records; labels render them. A tick or a clock on screen is the bug.
describe("law: no ticks and no wall-clock (rule 4, B-5)", () => {
  const TICK = /\{[^}]*\b\w*(?:_tick|ticks_advanced)\b[^}]*\}/;

  it("no *_tick field is interpolated into JSX", () => {
    const offenders = read(MOUNTED)
      .filter(({ src }) => TICK.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("no wall-clock or relative-time formatting reaches the mounted app", () => {
    const CLOCK =
      /toLocaleDateString|toLocaleTimeString|toLocaleString|Intl\.DateTimeFormat|formatDistance|\bdate-fns\b/;
    const offenders = read(MOUNTED)
      .filter(({ src }) => CLOCK.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 5 [F-1, F-2, GA-2]. The Glossary's words, never the database's.
describe("law: vocabulary is the Glossary's (rule 5)", () => {
  const BANNED = [
    "Entities",
    "Possessions",
    "Inventory",
    "Loot",
    "Relationships",
    "Perception record",
    "Epistemic",
    "Projection",
    "Canon",
  ];

  it.each(BANNED)("the mounted app never renders %s", (word) => {
    const re = new RegExp(`>[^<]*\\b${word}\\b|"[^"]*\\b${word}\\b[^"]*"`, "i");
    const offenders = read(MOUNTED)
      .filter(({ src }) => re.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 6 [B-3, B-4]. The system never states how anyone feels about the player.
describe("law: no relationship UI (rule 6)", () => {
  it("no trust/affinity/relationship affordance is mounted", () => {
    const RE = /\b(trust|affinity|relationship)[-_ ]?(meter|slider|score|level|bar|panel)\b/i;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 8 [GA-3]. The world computes no urgency, so displaying one would be invented data.
describe("law: no severity taxonomy (rule 8)", () => {
  it("no High/Medium/Low ranking is mounted", () => {
    const RE = /sev-(high|medium|low)|\bseverity\b|"(High|Medium|Low)"/;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 7 [C-11]. Correction is invisible: Continue implicitly accepts. Frozen, permanently.
describe("law: no corrections or approval UI (rule 7)", () => {
  it("no pending/approve/reject affordance is mounted", () => {
    const RE = /\b(approve|reject|pending changes|unsaved changes|review queue)\b/i;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Surface 1 constraint.
//
// AMENDED 2026-08-15 (world creation shipped). This law was written when the API had creation but no way
// to protect it — the original note here said, in full: "Creation exists server-side but is
// unauthenticated; a control would ship a hole." That premise is now gone. B-1 landed on 2026-08-13 and
// every route requires a bearer token, so a create control no longer exposes an unauthenticated write;
// and the backend gained a real creation pipeline (`prd_world_creation.md`) instead of the empty
// `POST /worlds` that authored no entities and produced a world nobody could enter. Offering a button
// for THAT would have been the dead affordance this file's sibling law forbids.
//
// What the law was actually protecting, and what it still enforces unchanged: THE PICKER IS READ-ONLY.
// Surface 1 lists the worlds you may choose between and does nothing else — no create tile, no "New
// World" affordance, no import. Creation lives on its own surface (`/create`), reachable from the rail,
// so the picker cannot grow a second job. The scan is therefore scoped to the picker rather than dropped:
// a create affordance appearing there again is still a violation, and this test still fails on it.
describe("law: the picker is read-only (surface 1)", () => {
  const PICKER = join("src", "routes", "worlds.tsx");

  it("the picker carries no create-world affordance", () => {
    const RE = /Create New World|New World|Import Seed|Create a world|Create a New World/i;
    const offenders = read([PICKER])
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("the picker is still a mounted surface, so this law cannot pass vacuously", () => {
    expect(MOUNTED).toContain(PICKER);
  });
});

// Rules 12-13 [D-7, C-4, D-14]. Whose perception this is, is decided server-side; and a nav item
// that goes nowhere is a promise the product cannot keep.
//
// AMENDED 2026-08-13 (B-1 landed). This law was written when the API had NO session model at all —
// `worldshandler.go` said of world creation, in its own words, "NOT AUTHENTICATED, and this is the
// deployment risk to close first ... should be the first thing auth is put in front of when B1
// lands." B1 landed: the deployed API now requires a bearer token on every route, because an
// unauthenticated caller reached the live world through the public origin, spent real model credits
// and wrote permanent canon. A login gate is therefore mandatory, and a mandatory gate is not the
// thing this law forbids.
//
// What the law still forbids, everywhere, unchanged: choosing WHOSE eyes you look through ("view
// as", a user/character/viewer switcher) — that is the D-7 perception boundary and it is decided
// server-side — plus any account/commerce surface (Billing, Subscription). What it now permits, in
// the AUTH GATE ONLY, is sign-in copy. Any other mounted file carrying sign-in/out language is still
// a violation: one gate is a gate, a gate per surface is a session model nobody designed.
const AUTH_GATE = [join("src", "routes", "__root.tsx"), join("src", "api", "auth.ts")];

describe("law: no session identity and no dead navigation (rules 12-13)", () => {
  it("no viewer/account/profile switcher is mounted", () => {
    const RE = /\b(view as|switch (?:user|character|viewer)|Billing|Subscription)\b/i;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("no sign-in affordance is mounted outside the auth gate", () => {
    const RE = /\b(sign (?:in|out)|log (?:in|out))\b/i;
    const offenders = read(MOUNTED)
      .filter(({ file }) => !AUTH_GATE.includes(file))
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('no mounted component ships an href="#" placeholder link', () => {
    const offenders = read(MOUNTED)
      .filter(({ src }) => /href="#"/.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 1 [D-7]. Restyle world text, wrap it, size it — never edit it. CSS text-transform is
// presentation and fine; mutating the string in JS before display is not.
describe("law: world-authored strings are not transformed (rule 1)", () => {
  // Scoped to a JSX interpolation on ONE line, in a .tsx file. Case-folding a word to index a
  // lookup table is not a display transform — `mood-plate.ts` lowercases `theme.mood` to choose a
  // house plate, and that mood is never rendered. What this catches is a payload string being
  // rewritten on its way to the screen. CSS `text-transform` is presentation and always fine.
  it("no .toUpperCase()/.toLowerCase() is applied inside a JSX interpolation", () => {
    const offenders = read(MOUNTED.filter((f) => f.endsWith(".tsx")))
      .filter(({ src }) => /\{[^}\n]*\.to(Upper|Lower)Case\(\)[^}\n]*\}/.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("no payload array is sorted or filtered before render", () => {
    const offenders = read(MOUNTED)
      .filter(({ src }) =>
        /\.(worlds|participants|current|carried|entries|records)\s*\.\s*(sort|filter|reverse)\(/.test(
          src,
        ),
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rule 11 [D-8]. The payload's stable path, or nothing. A resolved URL expires in minutes.
describe("law: images are built from the payload path (rule 11)", () => {
  it("no mounted component embeds a presigned URL or a cache-buster", () => {
    const RE = /X-Amz-|Signature=|[?&]_=\$\{|[?&]cb=/;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  /**
   * A world's own art may never stand in for a world that has none.
   *
   * PlayStage used to import `drowned-lantern-backdrop.jpg.asset.json` and render it behind ANY
   * world whose place carried no image. Since genesis commissions no art, every world a user
   * created was played against The Drowned Lantern's backdrop — the app showing one world's
   * picture while naming another world's room, which is rule 1's lie told in paint instead of
   * prose. The founder caught it on the first world he built.
   *
   * `null` is the ordinary state (D-8) and the house plates exist for exactly this: they are
   * atmosphere that depicts NO world, so standing one in claims nothing. The fence is therefore on
   * provenance, not on fallbacks — a fallback is fine, a fallback wearing a specific world's face
   * is not. Named after a world in the fiction, it is world art; keep it out of the shared path.
   */
  it("no mounted component falls back to a named world's art", () => {
    const NAMED_WORLD_ART = /["'@][^"']*(drowned|lantern|tavern|silt|registry)[^"']*\.(jpg|jpeg|png|webp|avif)/i;
    const offenders = read(MOUNTED)
      .filter(({ src }) => NAMED_WORLD_ART.test(src))
      .map(({ file }) => file);
    expect(
      offenders,
      "A mounted component references art named after a world in the fiction. World art belongs to " +
        "the world that earned it and arrives from the payload; a stand-in must be house art that " +
        "depicts no world (src/lib/mood-plate.ts).",
    ).toEqual([]);
  });
});

/**
 * Rule 2 [D-7], enforced structurally: no mounted component may render a hand-authored JSON blob.
 *
 * This closes the hole the other law tests could not see. They are static, so they catch a violation
 * written in code — a banned word in JSX, a dead link, a tick interpolated into markup. They cannot
 * see a violation that arrives as DATA, and that is exactly how the invented dashboard came back:
 * the same fabricated content, moved from `src/fixtures/` to `src/mocks/`, with the `href="#"`
 * placeholders removed. Every other rule passed.
 *
 * The test is therefore about provenance, not wording. Two kinds of JSON may reach the screen:
 *
 *  - a **captured payload**, which declares a `schema_version` and can be traced to a contract; and
 *  - an **asset descriptor** under `src/assets/`, which is a pointer to a picture, not world content.
 *
 * Anything else is somebody's imagination typed into a file, and once it is mounted a reader cannot
 * tell it from the world.
 */
describe("law: no mounted component renders a contract-less JSON blob (rule 2)", () => {
  /**
   * Known offenders, kept passing ONLY while a decision is pending. Each entry is a violation we can
   * see and have chosen not to fix yet — never a category we accept.
   *
   * Empty, and it should stay that way. The one entry it ever held was the invented dashboard mock;
   * the founder ruled that the dashboard stays and is fed real data instead, so the mock is gone.
   */
  const PENDING_RULING = new Set<string>();

  /** Every JSON module imported by something a route can reach. */
  function importedJson(): { file: string; importer: string }[] {
    const out: { file: string; importer: string }[] = [];
    for (const { file, src } of read(MOUNTED)) {
      for (const m of src.matchAll(/from\s+"(@\/[^"]+\.json)"/g)) {
        out.push({ file: m[1]!.replace("@/", "src/"), importer: file });
      }
    }
    return out;
  }

  function declaresSchemaVersion(path: string): boolean {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return (
      items.length > 0 &&
      items.every((x) => typeof (x as { schema_version?: unknown }).schema_version === "string")
    );
  }

  it("every JSON a route can reach is a captured payload or an asset descriptor", () => {
    const offenders = importedJson()
      .filter(({ file }) => !file.startsWith("src/assets/"))
      .filter(({ file }) => !declaresSchemaVersion(file))
      .filter(({ file }) => !PENDING_RULING.has(file))
      .map(({ file, importer }) => `${file} (imported by ${importer})`);

    expect(
      offenders,
      "A mounted component imports JSON that declares no schema_version, so it is not a captured " +
        "payload and cannot be traced to a contract. If it is real data, capture it from the backend " +
        "into src/fixtures/. If it is a design placeholder, keep it out of the mounted tree.",
    ).toEqual([]);
  });

  // An exemption that is no longer needed must be deleted, not left lying around looking load-bearing.
  it("no pending-ruling exemption outlives the import it excuses", () => {
    const imported = new Set(importedJson().map(({ file }) => file));
    const stale = [...PENDING_RULING].filter((f) => !imported.has(f));
    expect(
      stale,
      "This file is no longer imported by anything mounted, so its exemption is dead. Remove it from " +
        "PENDING_RULING.",
    ).toEqual([]);
  });
});


describe("law: genesis art style field is encoded exactly once", () => {
  it("sends a preset key verbatim", () => {
    expect(serializeArtStyle({ kind: "preset", key: "anime" })).toBe("anime");
  });

  it("prefixes a written style with custom:", () => {
    expect(serializeArtStyle({ kind: "custom", text: "rough ink, cold palette" })).toBe(
      "custom:rough ink, cold palette",
    );
  });

  it("omits art_style when nothing is chosen", () => {
    expect(serializeArtStyle({ kind: "none" })).toBeUndefined();
  });
});
