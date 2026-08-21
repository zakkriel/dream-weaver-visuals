import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
import {
  askInterview,
  answerKickstart,
  CreationConflictError,
  KickstartRefusedError,
  fetchArtStyles,
  buildWorld,
  BRIEF_MAX_CHARS,
  serializeArtStyle,
  type ArtStyleChoice,
  type ArtStylePreset,
  type ChoiceOption,
  type GenesisFrame,
  type InterviewAnswer,
  type InterviewTurn,
  type KickstartTurn,
} from "@/api/genesis";

export const Route = createFileRoute("/create")({
  // ?world=<id> resumes an unfinished creation: the world already exists server-side (durable
  // worlds), and the pending question is re-served against its id alone.
  validateSearch: (search: Record<string, unknown>): { world?: string } =>
    typeof search["world"] === "string" && search["world"] !== "" ? { world: search["world"] } : {},
  head: () => ({
    meta: [
      { title: "A new world — DreamChat" },
      { name: "description", content: "Describe a world, and walk into it." },
      { property: "og:title", content: "A new world — DreamChat" },
      { property: "og:description", content: "Describe a world, and walk into it." },
    ],
  }),
  component: CreateWorld,
});

/**
 * Surface: make a world (backend PRD `prd_world_creation.md`).
 *
 * Wiring only; the visuals are placeholder against the house tokens until Lovable designs this surface.
 * What it establishes is the flow and the data — and the flow is the point:
 *
 *  1. You write what you want. Nothing else is on screen, because there is nothing to decide yet.
 *  2. Then style appears. It applies equally to both build lanes, so it belongs before either lane is
 *     chosen.
 *  3. Only then do the two lanes appear. Fast builds from the brief alone; Custom asks first. The lane
 *     choice comes AFTER the writing on purpose — a fork presented before the user has said anything is a
 *     fork they have no basis to answer.
 *  4. Custom asks one question at a time. Every question carries real options, a free-text field, and
 *     "Build it now" — so the interview is never a corridor.
 *  5. The build streams. Each line is something that was actually authored; there is no progress bar,
 *     because the server sends no progress and a bar driven by a timer would be a number nothing produced
 *     (law 2).
 *
 * Nothing here is derived or filled in. Every string on screen is either the user's own words, a line the
 * world authored (rendered verbatim, law 1), or this surface's own chrome.
 */
function CreateWorld() {
  const [brief, setBrief] = useState("");
  const [lane, setLane] = useState<Lane>({ state: "writing" });
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [typed, setTyped] = useState("");
  const [styleChoice, setStyleChoice] = useState<ArtStyleChoice>({ kind: "none" });
  const [styleCatalog, setStyleCatalog] = useState<ArtStyleState>({ state: "loading" });
  // Guards a double-submit: the build takes a while and the button stays on screen throughout.
  const inFlight = useRef(false);
  const { world: resumeWorldId } = Route.useSearch();
  // Fires once per arrival with ?world=: the directory sends unfinished worlds here, and the pending
  // question is fetched against the id alone — no local state existed before this mount.
  const resumed = useRef(false);

  const trimmed = brief.trim();
  const tooLong = brief.length > BRIEF_MAX_CHARS;
  const canStart = trimmed !== "" && !tooLong;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const catalog = await fetchArtStyles();
        if (!alive) return;
        setStyleCatalog({ state: "ready", presets: catalog.styles ?? [] });
      } catch {
        if (!alive) return;
        // Like a failed interview question: style choice is optional, so creation stays usable without it.
        setStyleCatalog({ state: "unavailable" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (resumeWorldId === undefined || resumed.current) return;
    resumed.current = true;
    void resume(resumeWorldId);
    // resume is stable per mount in practice; this effect must run exactly once per ?world= arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeWorldId]);

  async function startInterview() {
    if (!canStart || inFlight.current) return;
    inFlight.current = true;
    setLane({ state: "asking" });
    try {
      const turn = await askInterview(trimmed, []);
      setLane(turn.done ? { state: "ready" } : { state: "question", turn });
    } catch {
      // A question that cannot be authored is not a dead end: the brief alone is still buildable, so the
      // honest move is to offer the build rather than to strand the user on an error.
      setLane({ state: "ready" });
    } finally {
      inFlight.current = false;
    }
  }

  async function answer(text: string, turn: InterviewTurn) {
    const said = text.trim();
    if (said === "" || inFlight.current) return;
    inFlight.current = true;
    const next = [...answers, { question: turn.question ?? "", answer: said }];
    setAnswers(next);
    setTyped("");
    setLane({ state: "asking" });
    try {
      const asked = await askInterview(trimmed, next);
      setLane(asked.done ? { state: "ready" } : { state: "question", turn: asked });
    } catch {
      setLane({ state: "ready" });
    } finally {
      inFlight.current = false;
    }
  }

  async function choose(at: Extract<Lane, { state: "choosing" }>, said: string) {
    const trimmedAnswer = said.trim();
    if (trimmedAnswer === "" || inFlight.current) return;
    inFlight.current = true;
    setTyped("");
    setLane({ state: "committing" });
    try {
      landTurn(await answerKickstart(at.worldId, trimmedAnswer), at.worldId);
    } catch (err) {
      if (err instanceof KickstartRefusedError) {
        // The world said no to THIS answer, not to the build: the world is durable and the question
        // comes back with the stated reason instead of costing the user anything but one answer.
        setLane({ ...at, refusal: err.message });
      } else if (err instanceof CreationConflictError) {
        // Finished or never resumable — the world's own stated answer, not a crash.
        setLane({ state: "refused", stated: err.message });
      } else {
        setLane({
          state: "failed",
          stated: err instanceof Error ? err.message : "the opening could not be reached",
          worldId: at.worldId,
        });
      }
    } finally {
      inFlight.current = false;
    }
  }

  // One kickstart turn, landed on the surface: the built world, or the next question.
  function landTurn(turn: KickstartTurn, worldId: string) {
    if (turn.done && turn.world) {
      setLane({
        state: "built",
        id: turn.world.id,
        displayName: turn.world.display_name,
        tagline: turn.world.tagline,
      });
      return;
    }
    setLane({
      state: "choosing",
      worldId,
      question: turn.question ?? "",
      options: turn.options ?? [],
    });
  }

  // Resume an unfinished creation: an empty answer re-serves the pending question. Used by the
  // ?world= entry from the directory and by the "keep making it" affordance after a failure.
  async function resume(worldId: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setTyped("");
    setLane({ state: "committing" });
    try {
      landTurn(await answerKickstart(worldId, ""), worldId);
    } catch (err) {
      if (err instanceof KickstartRefusedError || err instanceof CreationConflictError) {
        setLane({ state: "refused", stated: err.message });
      } else {
        setLane({
          state: "failed",
          stated: err instanceof Error ? err.message : "the world could not be reached",
          worldId,
        });
      }
    } finally {
      inFlight.current = false;
    }
  }

  async function build() {
    if (!canStart || inFlight.current) return;
    inFlight.current = true;
    const lines: string[] = [];
    setLane({ state: "building", lines });
    try {
      const artStyle = serializeArtStyle(styleChoice);
      await buildWorld(
        trimmed,
        answers,
        (frame) => {
          switch (frame.kind) {
            case "working":
              // A new array each time: React needs the identity change, and the frames are few.
              lines.push(frame.stated ?? "");
              setLane({ state: "building", lines: [...lines] });
              break;
            case "choice":
              // The free-text field is shared with the interview screen; without this, leftover text
              // typed but never submitted there would arrive pre-filled on the kickstart question.
              setTyped("");
              setLane({
                state: "choosing",
                worldId: frame.world_id ?? "",
                question: frame.question ?? "",
                options: frame.options ?? [],
              });
              break;
            case "refused":
              // world_id present means the world itself committed before this refusal — it is kept,
              // and the surface offers to continue it rather than to rebuild from the brief.
              setLane({ state: "refused", stated: frame.stated ?? "", worldId: frame.world_id });
              break;
            case "error":
              setLane({ state: "failed", stated: frame.stated ?? "", worldId: frame.world_id });
              break;
          }
        },
        artStyle,
      );
    } catch {
      // The stream never opened, or it broke before saying why. Distinct from a `refused` frame, which is
      // the world answering; this is the connection.
      setLane({ state: "failed", stated: "the build could not be reached" });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen w-full max-w-[52rem] flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl text-dc-text">A new world</h1>
          <p className="max-w-[58ch] font-body text-sm text-dc-text-muted">
            Describe somewhere you want to walk into. A sentence is enough; three paragraphs is
            better. You will arrive knowing nothing about it, which is the point.
          </p>
        </header>

        {/* The brief stays editable until a build starts: re-reading what you asked for is most useful
            exactly while you are being asked about it. */}
        {(lane.state === "writing" ||
          lane.state === "asking" ||
          lane.state === "question" ||
          lane.state === "ready") && (
          <section className="flex flex-col gap-3">
            <label htmlFor="brief" className="dc-label">
              What is this world?
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              placeholder="A cargo yard where the paperwork is the weapon…"
              aria-describedby={tooLong ? "brief-note" : undefined}
              className="dc-focus dc-input w-full resize-y rounded-dc-sm px-3 py-2 font-body text-sm"
            />
            {tooLong && (
              <p
                id="brief-note"
                role="status"
                aria-live="polite"
                className="font-ui text-sm text-dc-text-muted"
              >
                That is longer than the world can take in — {brief.length} characters, and the limit
                is {BRIEF_MAX_CHARS}.
              </p>
            )}
          </section>
        )}

        {/* This choice applies to BOTH lanes, so it sits between writing the brief and choosing a lane. */}
        {(lane.state === "writing" ||
          lane.state === "asking" ||
          lane.state === "question" ||
          lane.state === "ready") &&
          styleCatalog.state === "ready" && (
            <section aria-label="Art style" className="flex flex-col gap-3">
              <p className="dc-label">How should this world look?</p>
              <ul className="flex flex-col gap-2">
                {styleCatalog.presets.map((preset) => {
                  const selected = styleChoice.kind === "preset" && styleChoice.key === preset.key;
                  return (
                    <li key={preset.key}>
                      <button
                        type="button"
                        onClick={() => setStyleChoice({ kind: "preset", key: preset.key })}
                        // The accessible name is composed explicitly: visual lines are split, but SR output
                        // would otherwise run together.
                        aria-label={[preset.label, preset.blurb]
                          .filter((part) => part !== "")
                          .join(" — ")}
                        aria-pressed={selected}
                        className={`dc-focus flex w-full flex-col gap-1 rounded-dc-sm border px-4 py-3 text-left ${selected ? "border-dc-accent" : "border-dc-border hover:border-dc-accent"}`}
                      >
                        <span className="font-ui text-sm text-dc-text">{preset.label}</span>
                        <span className="font-body text-xs text-dc-text-muted">{preset.blurb}</span>
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      setStyleChoice((current) =>
                        current.kind === "custom" ? current : { kind: "custom", text: "" },
                      )
                    }
                    aria-label={["Describe your own", "Write a style for the whole world."].join(
                      " — ",
                    )}
                    aria-pressed={styleChoice.kind === "custom"}
                    className={`dc-focus flex w-full flex-col gap-1 rounded-dc-sm border px-4 py-3 text-left ${styleChoice.kind === "custom" ? "border-dc-accent" : "border-dc-border hover:border-dc-accent"}`}
                  >
                    <span className="font-ui text-sm text-dc-text">Describe your own</span>
                    <span className="font-body text-xs text-dc-text-muted">
                      Write the visual language yourself; this applies to either build lane.
                    </span>
                  </button>
                </li>
              </ul>
              {styleChoice.kind === "custom" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="custom-art-style" className="dc-label">
                    Your style
                  </label>
                  <input
                    id="custom-art-style"
                    value={styleChoice.text}
                    onChange={(e) => setStyleChoice({ kind: "custom", text: e.target.value })}
                    placeholder="high-contrast watercolor, pale skies, rough ink lines"
                    className="dc-focus dc-input min-w-[18rem] rounded-dc-sm px-3 py-2 font-body text-sm"
                  />
                </div>
              )}
            </section>
          )}

        {/* Both lanes, offered only once there is something to build from. */}
        {lane.state === "writing" && (
          <section aria-label="How much should I ask?" className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canStart}
                onClick={() => void build()}
                className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
              >
                Build it now
              </button>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => void startInterview()}
                className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted enabled:hover:border-dc-accent enabled:hover:text-dc-text disabled:cursor-not-allowed disabled:opacity-70"
              >
                Ask me about it first
              </button>
            </div>
            <p className="max-w-[58ch] font-ui text-sm text-dc-text-muted">
              Building now uses only what you wrote. Being asked first fills in what your
              description left open — you can stop and build at any point.
            </p>
          </section>
        )}

        {lane.state === "asking" && (
          <p role="status" aria-live="polite" className="font-ui text-sm text-dc-text-muted">
            Reading what you wrote…
          </p>
        )}

        {lane.state === "question" && (
          <Question
            turn={lane.turn}
            typed={typed}
            onTyped={setTyped}
            answered={answers.length}
            onChoose={(label) => void answer(label, lane.turn)}
            onBuild={() => void build()}
          />
        )}

        {lane.state === "ready" && (
          <section className="flex flex-col gap-3">
            <p role="status" aria-live="polite" className="font-ui text-sm text-dc-text-muted">
              {answers.length === 0
                ? "Nothing worth asking — your description already says enough."
                : "Nothing more worth asking."}
            </p>
            <div>
              <button
                type="button"
                onClick={() => void build()}
                className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium"
              >
                Build the world
              </button>
            </div>
          </section>
        )}

        {lane.state === "building" && (
          <section aria-label="Building" className="flex flex-col gap-3">
            {/* aria-live so a screen reader hears each line land. No percentage and no ETA: the server
                sends neither, and inventing one would be inventing a displayed value. */}
            <ol role="status" aria-live="polite" className="flex flex-col gap-2">
              {lane.lines.map((line, i) => (
                <li key={`${i}-${line}`} className="font-body text-sm text-dc-text">
                  {line}
                </li>
              ))}
            </ol>
            <p className="font-ui text-sm text-dc-text-muted">Still working. This takes a while.</p>
          </section>
        )}

        {lane.state === "choosing" && (
          <>
            {lane.refusal !== undefined && (
              <section aria-label="Refused" className="flex flex-col gap-1">
                {/* The world's own sentence, verbatim — same law as the refusal surface below: the user
                    needs the actual reason to choose differently. */}
                <p
                  role="status"
                  aria-live="polite"
                  className="max-w-[58ch] font-body text-sm text-dc-text"
                >
                  {lane.refusal}
                </p>
                <p className="max-w-[58ch] font-ui text-sm text-dc-text-muted">
                  Pick another way in, or write your own.
                </p>
              </section>
            )}
            <Question
              turn={{ question: lane.question, options: lane.options }}
              typed={typed}
              onTyped={setTyped}
              answered={0}
              onChoose={(label) => void choose(lane, label)}
              onBuild={() => {}}
              escape={{
                label: "Start here",
                onPress: () => {
                  const rec = lane.options.find((o) => o.recommended) ?? lane.options[0];
                  if (rec) void choose(lane, rec.label);
                },
              }}
            />
          </>
        )}

        {lane.state === "committing" && (
          <p role="status" aria-live="polite" className="font-ui text-sm text-dc-text-muted">
            Opening the way in&hellip;
          </p>
        )}

        {lane.state === "built" && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl text-dc-text">{lane.displayName}</h2>
              <p className="max-w-[58ch] font-body text-sm text-dc-text-muted">{lane.tagline}</p>
            </div>
            <nav aria-label="Your new world" className="flex flex-wrap gap-3">
              <Link
                to="/w/$worldId/play"
                params={{ worldId: lane.id }}
                className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium"
              >
                Walk in
              </Link>
              <Link
                to="/worlds"
                className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
              >
                All worlds
              </Link>
            </nav>
          </section>
        )}

        {(lane.state === "refused" || lane.state === "failed") && (
          <section className="flex flex-col gap-3">
            {/* The world's own stated reason, verbatim. A refusal is an answer, not a crash, and the user
                needs the actual sentence to know what to change. */}
            <p
              role="status"
              aria-live="polite"
              className="max-w-[58ch] font-body text-sm text-dc-text"
            >
              {lane.state === "refused" ? lane.stated : "The world could not be built."}
            </p>
            {lane.worldId !== undefined && lane.worldId !== "" && (
              <p className="max-w-[58ch] font-ui text-sm text-dc-text-muted">
                The world itself is written down and kept — only the way in is unfinished.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {lane.worldId !== undefined && lane.worldId !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    const id = lane.worldId;
                    if (id) void resume(id);
                  }}
                  className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium"
                >
                  Keep making this world
                </button>
              )}
              <button
                type="button"
                onClick={() => setLane({ state: "writing" })}
                className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
              >
                Change what you wrote
              </button>
            </div>
          </section>
        )}
      </main>
    </Atmosphere>
  );
}

/**
 * The shape `Question` actually reads off a turn — deliberately narrower than any one generated turn
 * type, so both the interview's `InterviewTurn` and a constructed view of a kickstart choice satisfy it
 * without carrying fields (`done`, `schema_version`) the component never looks at.
 */
type QuestionOption = { label: string; implication?: string; recommended?: boolean };
type QuestionTurn = { question?: string; why?: string; options?: readonly QuestionOption[] };

/**
 * One question: its options, a field to write your own answer instead, and the way out.
 *
 * The recommended option is marked in words rather than only by styling, because "recommended" is
 * information and styling alone does not reach a screen reader.
 *
 * `escape` parameterizes the way-out button so a non-interview caller (the kickstart choice screens) can
 * offer its own accept-defaults exit; omitted, the button keeps its original "Build it now" behavior so
 * every interview callsite is untouched.
 */
function Question({
  turn,
  typed,
  onTyped,
  answered,
  onChoose,
  onBuild,
  escape,
}: {
  turn: QuestionTurn;
  typed: string;
  onTyped: (v: string) => void;
  answered: number;
  onChoose: (label: string) => void;
  onBuild: () => void;
  escape?: { label: string; onPress: () => void };
}) {
  const options: readonly QuestionOption[] = turn.options ?? [];
  return (
    <section aria-label="One question" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl text-dc-text">{turn.question}</h2>
        {turn.why && <p className="max-w-[58ch] font-ui text-sm text-dc-text-muted">{turn.why}</p>}
        {answered > 0 && (
          <p className="font-ui text-xs text-dc-text-muted">{answered} answered so far.</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.label}>
            <button
              type="button"
              onClick={() => onChoose(option.label)}
              // The accessible name is composed explicitly rather than left to concatenation. The two
              // spans are separate LINES visually (flex-col), but a screen reader joins them with no
              // separator, which read as "…the recordsthe pressure is what is written down".
              aria-label={[
                option.label,
                option.recommended ? "(recommended)" : "",
                option.implication ?? "",
              ]
                .filter((part) => part !== "")
                .join(" — ")}
              className="dc-focus flex w-full flex-col gap-1 rounded-dc-sm border border-dc-border px-4 py-3 text-left hover:border-dc-accent"
            >
              <span className="font-ui text-sm text-dc-text">
                {option.label}
                {option.recommended && (
                  <span className="ml-2 font-ui text-xs text-dc-text-muted">(recommended)</span>
                )}
              </span>
              {option.implication && (
                <span className="font-body text-xs text-dc-text-muted">{option.implication}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <label htmlFor="own-answer" className="dc-label">
          Or write your answer
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="own-answer"
            value={typed}
            onChange={(e) => onTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onChoose(typed);
              }
            }}
            className="dc-focus dc-input min-w-[18rem] flex-1 rounded-dc-sm px-3 py-2 font-body text-sm"
          />
          <button
            type="button"
            disabled={typed.trim() === ""}
            onClick={() => onChoose(typed)}
            className="dc-focus rounded-dc-sm border border-dc-border px-4 py-2 font-ui text-sm text-dc-text-muted enabled:hover:border-dc-accent enabled:hover:text-dc-text disabled:cursor-not-allowed disabled:opacity-70"
          >
            Answer
          </button>
        </div>
      </div>

      {/* Always available. An interview you cannot leave is an interrogation. */}
      <div>
        <button
          type="button"
          onClick={escape ? escape.onPress : onBuild}
          className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
        >
          {escape ? escape.label : "Build it now"}
        </button>
      </div>
    </section>
  );
}

/**
 * Where the journey is. `writing` and `ready` both show the brief and a build button; they differ in what
 * they say about the interview, which is why they are distinct rather than one state with a flag.
 */
type ArtStyleState =
  { state: "loading" } | { state: "ready"; presets: ArtStylePreset[] } | { state: "unavailable" };

type Lane =
  | { state: "writing" }
  | { state: "asking" }
  | { state: "question"; turn: InterviewTurn }
  | { state: "ready" }
  | { state: "building"; lines: string[] }
  | {
      state: "choosing";
      worldId: string;
      question: string;
      options: ChoiceOption[];
      refusal?: string;
    }
  | { state: "committing" }
  | { state: "built"; id: string; displayName: string; tagline: string }
  | { state: "refused"; stated: string; worldId?: string | undefined }
  | { state: "failed"; stated: string; worldId?: string | undefined };
