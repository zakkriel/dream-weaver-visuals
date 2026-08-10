import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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
  (f) => !f.startsWith(join("src", "api", "types")) && !f.startsWith(join("src", "components", "ui")),
);

/** Only what a route can actually reach. Unrouted components cannot violate anything on screen. */
function reachableFrom(entry: string[], seen = new Set<string>()): Set<string> {
  for (const file of entry) {
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const spec of src.matchAll(/from\s+"(@\/[^"]+)"/g)) {
      const rel = spec[1]!.replace("@/", "src/");
      for (const cand of [`${rel}.tsx`, `${rel}.ts`, join(rel, "index.tsx"), join(rel, "index.ts")]) {
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
  (f) => !f.startsWith(join("src", "components", "ui")) && !f.startsWith(join("src", "api", "types")),
);

function read(files: string[]): { file: string; src: string }[] {
  return files.map((file) => ({ file, src: readFileSync(file, "utf8") }));
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
    const CLOCK = /toLocaleDateString|toLocaleTimeString|toLocaleString|Intl\.DateTimeFormat|formatDistance|\bdate-fns\b/;
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

// Surface 1 constraint. Creation exists server-side but is unauthenticated; a control would ship a hole.
describe("law: the picker is read-only (surface 1)", () => {
  it("no create-world affordance is mounted", () => {
    const RE = /Create New World|New World|Import Seed|Create a world/i;
    const offenders = read(MOUNTED)
      .filter(({ src }) => RE.test(src))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

// Rules 12-13 [D-7, C-4, D-14]. Whose perception this is, is decided server-side; and a nav item
// that goes nowhere is a promise the product cannot keep.
describe("law: no session identity and no dead navigation (rules 12-13)", () => {
  it("no viewer/account/profile switcher is mounted", () => {
    const RE = /\b(view as|switch (?:user|character|viewer)|sign (?:in|out)|log (?:in|out)|Billing|Subscription)\b/i;
    const offenders = read(MOUNTED)
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
      .filter(({ src }) => /\.(worlds|participants|current|carried|entries|records)\s*\.\s*(sort|filter|reverse)\(/.test(src))
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
});
