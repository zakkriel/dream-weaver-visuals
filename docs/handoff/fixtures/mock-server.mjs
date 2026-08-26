#!/usr/bin/env node
// A contract-shaped stand-in for the beat loop, for driving the play surface with no backend.
//
// WHY THIS EXISTS. The real engine needs Postgres, a seeded world and (outside the fake bridge) live
// LLM seats. Even with all of that running, several contract-legal states cannot currently be reached
// from any client: movement decomposes to an empty chain (backend SPEC-030), an UNRESOLVED tie is
// unreachable against the seeded world because the dev bridge ties on equal candidate-name LENGTH and
// Kade's seven candidate names are all different lengths, and the journey halts need movement to work.
// This server emits those states on demand so the surfaces that render them can be exercised and seen.
//
// It is NOT a second engine and decides nothing about a world. It replays frame shapes taken from
// bytes observed on the wire against the real server, so the FE stays honest: presentation only,
// never world truth (D-7).
//
// SCOPE. The play loop only — `scene/current` plus the two beat endpoints. The Compendium reads are
// deliberately absent: they work against the real backend with no keys or seats, so a stub for them
// would be a second source for data that already has a working one.
//
//   node scripts/dev/fake-engine.mjs            # :8787
//   node scripts/dev/fake-engine.mjs --port 9000
//   BACKEND_URL=http://localhost:8787 npm run dev
//
// Then type a SCENARIO KEYWORD as the beat text to select what comes back (`--help` lists them).
// Anything else is an ordinary completed beat that commits one line.

import { createServer } from "node:http";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`fake-engine — contract-shaped beat loop for the play surface

  --port N     listen on N (default 8787)

Type one of these as the beat text to drive a state:

  unresolved         two options with distinguishing detail — the ordinary collision
  unresolved-same    two options that read IDENTICALLY — the honest edge, position is the only clue
  journey            an active travel journey, mid-leg
  arrive             a journey that reached its goal
  reset              put the scene back to its landing state (clears an in-flight journey)
  interrupt          journey_interrupted — the world cuts across your path
  barred             journey_barred — the way is shut
  bounce | telegraph | premise_broken | turn_budget | gate_reject
                     the remaining halt reasons, one each
  error              a failure AFTER the stream opened, delivered as an error frame
  boom               a failure BEFORE the stream opens, delivered as HTTP 500
  slow               frames spread over ~2.5s, to watch the pending state and real streaming

Anything else commits one line and completes.`);
  process.exit(0);
}
const portFlag = args.indexOf("--port");
const PORT = portFlag === -1 ? 8787 : Number(args[portFlag + 1]);

// The seeded Drowned Lantern's real ids, so what this serves lines up with the world the FE's dev
// fallbacks point at (`DEV_PLAY_WORLD` / `DEV_PLAY_VIEWER` in src/routes.ts).
const MARA = "2ac70000-0000-0000-0000-0000000000a2";
const MUSCLE = "2ac70000-0000-0000-0000-0000000000a3";
const HOODED_TWO = "2ac70000-0000-0000-0000-0000000000aa";
const HOODED = "2ac70000-0000-0000-0000-0000000000a4";
const TAVERN = "210c0000-0000-0000-0000-0000000000d1";

/**
 * An image reference in the payload's own shape (`image_ref/1`). A PATH, never a resolved URL — the
 * real backend 302s this to a presigned URL that expires in minutes, and this stub answers it with a
 * generated placeholder so the swap-from-silhouette path can be seen without the image platform.
 */
const imageRef = (id) => ({
  schema_version: "image_ref/1",
  asset_id: id,
  path: `/worlds/22222222-2222-2222-2222-222222222222/images/${id}`,
});

const IMAGE_RE = /^\/worlds\/[^/]+\/images\/([^/]+)$/;

/** A tiny deterministic SVG portrait, so a stubbed face is obviously a stub and never mistaken for art. */
function placeholderPortrait(id, tier) {
  const hue = [...id].reduce((a, c) => (a + c.charCodeAt(0)) % 360, 0);
  const px = tier === "thumbnail" ? 256 : tier === "final" ? 1024 : 768;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" fill="hsl(${hue} 30% 22%)"/>`
    + `<circle cx="32" cy="24" r="11" fill="hsl(${hue} 40% 62%)"/>`
    + `<path d="M10 62c0-13 10-19 22-19s22 6 22 19z" fill="hsl(${hue} 40% 62%)"/>`
    + `<text x="32" y="60" font-size="5" text-anchor="middle" fill="hsl(${hue} 20% 85%)">stub ${tier}</text>`
    + `</svg>`;
}

/**
 * The scene, mutated in place across beats exactly as the real engine's does: the clock advances and
 * `current` accumulates the lines the viewer now perceives. Holding it here is what makes the surface's
 * "you are back where you were" landing (C-1) real rather than a fixed snapshot.
 */
const initialScene = () => ({
  schema_version: "scene_current/2",
  place: {
    id: TAVERN,
    label: "The Drowned Lantern",
    description: "Low beams, salt-rot, one hearth, a bar with a hatch, a back door to the alley.",
    tone: "tense",
  },
  // Two hooded figures, as the seed really holds — and carrying the distinguishing detail the ruling
  // puts on the display list, not just on the candidate whitelist.
  participants: [
    { id: MARA, label: "Mara", kind: "actor", image: imageRef(MARA) },
    { id: MUSCLE, label: "the muscle by the bar", kind: "actor", image: imageRef(MUSCLE) },
    // No picture yet — the ordinary state, and what the silhouette is for (D-8).
    { id: HOODED, label: "a hooded figure by the bar", kind: "actor", image: null },
    { id: HOODED_TWO, label: "a hooded figure by the ballast crate", kind: "actor", image: null },
  ],
  now: { tick: 50, display_label: "Arrival" },
  journey: null,
  current: ["Mara", "I stepped into the Drowned Lantern."],
});

// Reassigned by the `reset` keyword: scenarios leave state behind on purpose (a journey stays under
// way until something ends it), so driving several in a row needs a way back to the start.
let scene = initialScene();

const journeyLeg = {
  active: true,
  kind: "travel",
  goal_label: "the harbour steps",
  where_label: "Dock Street",
  progress: 0.4,
  legs_done: 2,
  legs_total: 5,
  interruptible: true,
  status: "active",
};

const frame = (kind, body) => ({ schema_version: "beat_frame/2", kind, ...body });

const resultFrame = (halt, extra = {}) =>
  frame("result", {
    result: {
      committed: [],
      halt_reason: halt,
      ticks_advanced: 2,
      unresolved_candidates: [],
      telegraphs: [],
      ...extra,
    },
  });

/**
 * Frame order is the server's own: interpretation → narration → scene → journey → result → trace,
 * with the trace present because a debug server always sends it — the client is what withholds it
 * without `?trace=1`, and collapsing those two keys into one is the trap (C-4).
 */
function framesFor(text, press) {
  const key = text.trim().toLowerCase();
  const said = press === "continue" ? "(continue)" : text;

  const interpretation = frame("interpretation", {
    chain: key === "" ? [] : [{ type: "Communicated", stated: said }],
  });
  const narration = (t, speakerId = null, label = "", kind = "narration") =>
    frame("narration", { message: { speaker_id: speakerId, speaker_label: label, kind, text: t } });
  const trace = (halt, committed = []) =>
    frame("trace", {
      reasoning_log: {
        decompose: key === "" ? [] : [{ type: "Communicated", stated: said }],
        world_turn: [
          {
            clock_delta_s: 2,
            rolls: [
              { tier: "large", chance: 0.000006, roll: 0.61, fired: false },
              { tier: "medium", chance: 0.000147, roll: 0.389, fired: false },
              { tier: "small", chance: 0.008833, roll: 0.425, fired: false },
            ],
          },
        ],
        halt_reason: halt,
        committed,
      },
    });

  const sceneFrame = () => frame("scene", { scene: structuredClone(scene) });

  switch (key) {
    case "reset":
      scene = initialScene();
      return [
        interpretation,
        narration("The room settles back to how you found it."),
        sceneFrame(),
        frame("journey", { journey: null }),
        resultFrame("completed"),
        trace("completed"),
      ];
    // beat_frame/2 made the candidates nameable, and the ruling is that a collision carries the
    // distinguishing detail in the label itself — so the ask can simply read them back.
    case "unresolved":
      return [
        interpretation,
        narration("Two of them look up. You did not say which."),
        sceneFrame(),
        frame("journey", { journey: null }),
        resultFrame("unresolved", {
          ticks_advanced: 0,
          unresolved_candidates: [
            { id: HOODED, label: "a hooded figure by the bar" },
            { id: HOODED_TWO, label: "a hooded figure by the ballast crate" },
          ],
        }),
        trace("unresolved"),
      ];
    // The honest edge the ruling keeps on purpose: a pair the viewer genuinely cannot tell apart keeps
    // ONE identical label, so the only thing left to address them by is their position.
    case "unresolved-same":
      return [
        interpretation,
        narration("Two of them look up, and nothing tells them apart."),
        sceneFrame(),
        frame("journey", { journey: null }),
        resultFrame("unresolved", {
          ticks_advanced: 0,
          unresolved_candidates: [
            { id: HOODED, label: "a hooded figure" },
            { id: HOODED_TWO, label: "a hooded figure" },
          ],
        }),
        trace("unresolved"),
      ];
    case "journey":
      scene.journey = journeyLeg;
      return [
        interpretation,
        narration("You push out into the wet dark and start walking."),
        sceneFrame(),
        frame("journey", { journey: journeyLeg }),
        resultFrame("journey_leg"),
        trace("journey_leg"),
      ];
    case "arrive": {
      const arrived = { ...journeyLeg, progress: 1, legs_done: 5, status: "arrived", where_label: null };
      scene.journey = null;
      return [
        interpretation,
        narration("The harbour steps resolve out of the mist. You are here."),
        sceneFrame(),
        frame("journey", { journey: arrived }),
        resultFrame("journey_arrived"),
        trace("journey_arrived"),
      ];
    }
    case "interrupt":
      scene.journey = journeyLeg;
      return [
        interpretation,
        narration("A shape steps out of a doorway ahead and does not move aside."),
        sceneFrame(),
        frame("journey", { journey: journeyLeg }),
        resultFrame("journey_interrupted"),
        trace("journey_interrupted"),
      ];
    case "barred":
      scene.journey = null;
      return [
        interpretation,
        narration("The gate is chained. Whoever shut it meant it to stay shut."),
        sceneFrame(),
        frame("journey", { journey: { ...journeyLeg, active: false, status: "ended" } }),
        resultFrame("journey_barred"),
        trace("journey_barred"),
      ];
    case "bounce":
    case "telegraph":
    case "premise_broken":
    case "turn_budget":
    case "gate_reject":
      return [
        interpretation,
        narration("The room does not give you that."),
        sceneFrame(),
        frame("journey", { journey: null }),
        resultFrame(key),
        trace(key),
      ];
    // A failure after the status line is already sent can only arrive as a frame, never as a status
    // code — the surface has to handle both regimes.
    case "error":
      return [
        interpretation,
        narration("You start to speak."),
        frame("error", { message: "The world could not finish that." }),
      ];
    default: {
      const line = press === "continue" ? "the room breathes" : text.trim();
      const committed = ["8f14e45f-ceea-467a-9c3e-bd2fa1b3d5aa"];
      scene.now.tick += 2;
      if (line !== "") scene.current.push(line);
      return [
        interpretation,
        narration("Scene: the common room, and the rain on the shutters."),
        narration("The tide turns at dusk.", MARA, "Mara", "speech"),
        // A speaker the world has shown no face for: the narration card's silhouette (D-8), which
        // needs BOTH paths on screen at once to be worth looking at.
        narration("draws back into the smoke", HOODED, "a hooded figure by the bar", "action"),
        sceneFrame(),
        frame("journey", { journey: scene.journey }),
        resultFrame("completed", { committed }),
        trace("completed", committed),
      ];
    }
  }
}

/**
 * Exact-match allowlist, mirroring the backend's own CORS shape (SPEC-021).
 *
 * 5273 is the live dev port. 5173 and 127.0.0.1:5173 belonged to `dreamchat-frontend`, the archived
 * predecessor repo, and are retired with it — kept here only so an old bookmark against this dev
 * mock does not fail with an unexplained CORS error.
 */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5273",
  "http://127.0.0.1:5273",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const SCENE_RE = /^\/worlds\/([^/]+)\/scene\/current$/;
const BEATS_RE = /^\/worlds\/([^/]+)\/beats(\/continue)?$/;

/**
 * The world directory (SPEC-028). Served because the app now LANDS on the picker: without this the
 * offline path would break at the front door. Two worlds so the picker has something to choose
 * between, and so an unplayable one is visible — a world with nobody to be in it is real and listed.
 */
const DIRECTORY = {
  schema_version: "world_directory/1",
  worlds: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      display_name: "The Drowned Lantern",
      theme: { schema_version: "world_theme/1", accent: "#c9a227", mood: "nocturne", ornament: "filigree" },
      playable: true,
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      display_name: "An Unpeopled Draft",
      theme: { schema_version: "world_theme/1", accent: "#7a8b99", mood: "mist", ornament: "none" },
      playable: false,
    },
  ],
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  cors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const image = IMAGE_RE.exec(url.pathname);
  if (req.method === "GET" && image) {
    const tier = url.searchParams.get("tier") ?? "preview";
    const body = placeholderPortrait(image[1], tier);
    // No-store on purpose: the real backend redirects to a URL that expires, so nothing downstream
    // should learn to treat an image response here as durable.
    res
      .writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" })
      .end(body);
    console.log(`GET  ${url.pathname} tier=${tier} → placeholder portrait`);
    return;
  }

  if (req.method === "GET" && url.pathname === "/worlds") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(DIRECTORY));
    console.log(`GET  /worlds → world_directory/1 (${DIRECTORY.worlds.length} worlds)`);
    return;
  }

  if (req.method === "GET" && SCENE_RE.test(url.pathname)) {
    const body = JSON.stringify(scene);
    res.writeHead(200, { "Content-Type": "application/json" }).end(body);
    console.log(`GET  ${url.pathname} → scene_current/2 tick=${scene.now.tick}`);
    return;
  }

  const beats = BEATS_RE.exec(url.pathname);
  if (req.method === "POST" && beats) {
    const press = beats[2] ? "continue" : "text";
    // The wire field is `text` — confirmed against the running backend.
    const raw = press === "continue" ? "" : await readBody(req);
    const text = press === "continue" ? "" : (JSON.parse(raw || "{}").text ?? "");

    if (text.trim().toLowerCase() === "boom") {
      res.writeHead(500, { "Content-Type": "text/plain" }).end("beat failed before the stream opened");
      console.log(`POST ${url.pathname} → 500 (pre-stream failure)`);
      return;
    }

    const frames = framesFor(text, press);
    const slow = text.trim().toLowerCase() === "slow";
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    for (const f of frames) {
      if (slow) await new Promise((r) => setTimeout(r, 2500 / frames.length));
      res.write(`data: ${JSON.stringify(f)}\n\n`);
    }
    res.end();
    console.log(`POST ${url.pathname} press=${press} text=${JSON.stringify(text)} → ${frames.length} frames`);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => resolve(s));
    req.on("error", reject);
  });
}

server.listen(PORT, () => {
  console.log(`fake-engine on http://localhost:${PORT}`);
  console.log(`point the FE at it:  BACKEND_URL=http://localhost:${PORT} npm run dev`);
  console.log(`scenario keywords:   node scripts/dev/fake-engine.mjs --help`);
});
