import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { PlayStage, StageIsland, type SpriteEmotion, type StageLine } from "@/components/dc/PlayStage";
import {
  fetchCarrying,
  fetchScene,
  imageUrl,
  type BeatFrame,
  type BeatOutcome,
  type Carrying,
  type ImageRef,
  type NarrationMessage,
  type Scene,
} from "@/api";
import { loadScene, loadCarrying, loadHistory, submitBeat, type Loaded } from "@/api/load";
import { HISTORY_START, NO_HISTORY, atBeginning, canLoadOlder, historyReducer } from "@/api/history";

export const Route = createFileRoute("/w/$worldId/play")({
  head: () => ({
    meta: [
      { title: "Play — DreamChat" },
      { name: "description", content: "Play a persistent world in DreamChat." },
      { property: "og:title", content: "Play — DreamChat" },
      { property: "og:description", content: "Play a persistent world in DreamChat." },
    ],
  }),
  component: Play,
});

/**
 * One thing that appeared in the narration panel, in the order it appeared.
 *
 * `remembered` marks a line read back out of the stored record rather than streamed this session.
 * A remembered line keeps the label it was delivered with and is never re-resolved against the cast
 * as it stands now (D-7); it also wears no portrait, because `transcript/2` stores no picture per
 * entry and the silhouette is the honest likeness of a memory (D-8) — see `api/history.ts`.
 */
export type Line =
  | { who: "you"; text: string; remembered?: true }
  | { who: "world"; message: NarrationMessage; remembered?: true }
  | { who: "note"; text: string; remembered?: true };

/**
 * Player-language wording for the engine's halt reasons.
 *
 * The raw vocabulary is engine-facing ("telegraph", "bounce") and must never reach the screen (F-2).
 * `completed` never arrives here.
 */
/** One place the engine's vocabulary becomes the player's, used live and when reading history back. */
export function haltCopy(reason: string): string {
  return HALT[reason] ?? "Something snagged — try again.";
}

const HALT: Record<string, string> = {
  telegraph: "The world moves — answer it.",
  bounce: "That didn't land as possible — say it differently.",
  unresolved: "Be specific — who or which?",
  premise_broken: "The moment changed before you could act.",
  turn_budget: "That cannot be done at all.",
  gate_reject: "The world blocked that.",
  world_eruption: "Something breaks in on the moment.",
  journey_leg: "You are on your way. Continue.",
  journey_arrived: "You arrive.",
  journey_interrupted: "Something cuts across your path.",
  journey_barred: "The way is shut.",
  journey_unresolved: "You waited, and it never came.",
};


function readEmotion(value: unknown): SpriteEmotion | null {
  return value === "neutral" || value === "happy" || value === "angry" || value === "sad"
    ? value
    : null;
}

function messageEmotion(message: NarrationMessage): SpriteEmotion | undefined {
  const raw = readEmotion((message as { emotion?: unknown }).emotion);
  return raw ?? undefined;
}

function spriteUrls(participant: Scene["participants"][number]):
  | Record<SpriteEmotion, string>
  | undefined {
  const sprites = (participant as {
    sprites?: {
      neutral?: ImageRef;
      happy?: ImageRef;
      angry?: ImageRef;
      sad?: ImageRef;
    } | null;
  }).sprites;
  if (!sprites?.neutral || !sprites.happy || !sprites.angry || !sprites.sad) return undefined;
  return {
    neutral: imageUrl(sprites.neutral, "final"),
    happy: imageUrl(sprites.happy, "final"),
    angry: imageUrl(sprites.angry, "final"),
    sad: imageUrl(sprites.sad, "final"),
  };
}

/**
 * Surface 3 — Play.
 *
 * Wiring only: this route decides what data reaches the screen and in what state. Every visual
 * decision here is placeholder Tailwind against the house tokens, waiting for Lovable's play
 * components — see AGENTS.md. Nothing in `components/dc/` was restyled to build it.
 */



/**
 * Fold the arrival-ordered transcript into stage lines.
 *
 * Presentation shapes only: ids become faces, nothing is reordered, nothing is dropped. Consecutive
 * lines from the SAME speaker fold into one, so a person talking across several narration frames
 * gets one portrait and one name instead of their face stacked once per frame.
 *
 * Grouping is on `speaker_id` and never on the label: two actors can carry the identical perceived
 * label on purpose, and grouping by label would fuse two people into one on screen (B-1). A line with
 * a null speaker_id is nobody's voice — it never joins a run and it breaks one, because narration
 * between two speeches is a beat of silence, not a continuation.
 */
export function groupStageLines(
  lines: readonly Line[],
  faceOf: (speakerId: string | null) => string | undefined,
): StageLine[] {
  const out: StageLine[] = [];
  let runSpeaker: string | null = null;
  let runRemembered = false;
  for (const line of lines) {
    if (line.who !== "world") {
      runSpeaker = null;
      out.push({ who: line.who, text: line.text });
      continue;
    }
    const m = line.message;
    const remembered = line.remembered === true;
    const groupable = m.kind !== "narration" && m.speaker_id !== null;
    const prev = out[out.length - 1];
    // A run never crosses the seam between what was read back and what is arriving now. The two can
    // carry different labels and different faces for the same speaker, and folding them into one
    // card would put today's name over words said before the viewer knew it (B-1).
    const continues = groupable && runSpeaker === m.speaker_id && runRemembered === remembered;
    if (continues && prev?.who === "world") {
      out[out.length - 1] = {
        ...prev,
        more: [...(prev.more ?? []), { kind: m.kind, text: m.text, quote: m.quote, emotion: messageEmotion(m) }],
      };
      continue;
    }
    runSpeaker = groupable ? m.speaker_id : null;
    runRemembered = remembered;
    out.push({
      who: "world",
      kind: m.kind,
      speakerId: m.speaker_id,
      speakerLabel: m.speaker_label,
      text: m.text,
      quote: m.quote,
      emotion: messageEmotion(m),
      // Only a live line is resolved against the cast standing in the room. A memory keeps the
      // silhouette rather than borrowing a face the viewer did not have at the time.
      face: remembered ? undefined : faceOf(m.speaker_id),
    });
  }
  return out;
}

function Play() {
  const { worldId } = Route.useParams();
  const [scene, setScene] = useState<Loaded<Scene> | null>(null);
  const [carrying, setCarrying] = useState<Carrying | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [outcome, setOutcome] = useState<BeatOutcome | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speakerEmotion, setSpeakerEmotion] = useState<ReadonlyMap<string, SpriteEmotion>>(new Map());
  const [recentSpeakerIds, setRecentSpeakerIds] = useState<readonly string[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [beatsSettled, setBeatsSettled] = useState(0);

  /**
   * The played history: everything said and generated here before this session, read back.
   *
   * The first page loads with the scene, so the card opens already carrying the story rather than
   * blank until someone speaks. Older pages arrive only when the reader asks — by scrolling up in the
   * expanded view — because a world with a thousand beats should not send them all to draw one card.
   */
  const [history, dispatchHistory] = useReducer(historyReducer, HISTORY_START);
  const [expanded, setExpanded] = useState(false);
  const historyRef = useRef(history);
  historyRef.current = history;

  // A dispatch does not take effect until the next render, but a scroll gesture fires many events
  // before then — so the state alone cannot say "already asking". This says it synchronously.
  const inFlightRef = useRef(false);

  const read = useCallback(
    (from: number | null) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      dispatchHistory({ type: "loading", from });
      void loadHistory(worldId, haltCopy, from ?? undefined)
        .then((page) => {
          dispatchHistory(page === NO_HISTORY ? { type: "absent" } : { type: "page", page, from });
        })
        .catch(() => dispatchHistory({ type: "failed" }))
        .finally(() => {
          inFlightRef.current = false;
        });
    },
    [worldId],
  );

  const loadOlder = useCallback(() => {
    const state = historyRef.current;
    if (!canLoadOlder(state)) return;
    read(state.next);
  }, [read]);

  // The first page, once per world. Keyed on the id rather than a bare mount flag: React mounts this
  // twice in development, and a plain "have I run" guard reset on mount fired the same read three
  // times per page load. It is idempotent in the reducer, but three requests is still three requests.
  const openedWorld = useRef<string | null>(null);
  useEffect(() => {
    setSpeakerEmotion(new Map());
    setRecentSpeakerIds([]);
    if (openedWorld.current === worldId) return;
    openedWorld.current = worldId;
    inFlightRef.current = false;
    read(null);
  }, [read, worldId]);

  /**
   * Every face the world has shown this session, keyed by actor id, latest payload winning.
   *
   * The participants row draws the CURRENT cast, but the transcript is history: a line spoken in the
   * tavern is still on screen after the player has walked away. Resolving a card's face from the
   * current scene alone would blank it. What is kept is the payload's stable image REFERENCE, never
   * a resolved URL — those expire (D-8).
   */
  const [faces, setFaces] = useState<ReadonlyMap<string, ImageRef>>(new Map());

  const remember = useCallback((s: Scene) => {
    setFaces((known) => {
      let next: Map<string, ImageRef> | null = null;
      for (const p of s.participants) {
        if (!p.image || known.get(p.id)?.path === p.image.path) continue;
        next ??= new Map(known);
        next.set(p.id, p.image);
      }
      return next ?? known;
    });
  }, []);

  useEffect(() => {
    let live = true;
    void loadScene(worldId, () => fetchScene(worldId)).then((r) => {
      if (!live) return;
      setScene(r);
      if (r.state === "ok") remember(r.data);
    });
    return () => {
      live = false;
    };
  }, [worldId, remember]);

  // Carrying is re-read once a beat settles: picking something up is an ordinary canonical change and
  // no frame announces it, so the overlay would otherwise show what you had before you reached.
  useEffect(() => {
    let live = true;
    void loadCarrying(worldId, () => fetchCarrying(worldId)).then((r) => {
      if (live) setCarrying(r.state === "ok" ? r.data : null);
    });
    return () => {
      live = false;
    };
  }, [worldId, beatsSettled]);

  const onFrame = useCallback(
    (frame: BeatFrame) => {
      switch (frame.kind) {
        case "narration":
          setLines((prev) => [...prev, { who: "world", message: frame.message }]);
          setSpeakingId(frame.message.speaker_id);
          if (frame.message.speaker_id !== null) {
            setRecentSpeakerIds((prev) => [frame.message.speaker_id as string, ...prev.filter((id) => id !== frame.message.speaker_id)].slice(0, 12));
            if (frame.message.kind === "speech") {
              const emotion = readEmotion((frame.message as { emotion?: unknown }).emotion) ?? "neutral";
              setSpeakerEmotion((prev) => {
                if (prev.get(frame.message.speaker_id as string) === emotion) return prev;
                const next = new Map(prev);
                next.set(frame.message.speaker_id as string, emotion);
                return next;
              });
            }
          }
          return;
        case "scene":
          setScene({ state: "ok", data: frame.scene as Scene, source: "live" });
          remember(frame.scene as Scene);
          return;
        case "result":
          setOutcome(frame.result);
          return;
        case "error":
          // A failure after the stream opened arrives as a frame, never a status code. It is the
          // server's own player-safe message; render it as it came.
          setLines((prev) => [...prev, { who: "note", text: frame.message }]);
          return;
        default:
          return;
      }
    },
    [remember],
  );

  const inFlight = useRef(false);
  async function submit(press: "text" | "continue", text: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    if (press === "text") setLines((prev) => [...prev, { who: "you", text }]);
    setInput("");
    setOutcome(null);
    setFailed(false);
    setPending(true);
    try {
      await submitBeat(worldId, press, text, onFrame);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
      inFlight.current = false;
      setBeatsSettled((n) => n + 1);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (text !== "") void submit("text", text);
  }

  /**
   * The face for one narration card, or nothing.
   *
   * An unattributed line carries `speaker_id: null` — the narrator is nobody and gets no portrait.
   * Thumbnail: the card draws it small, so a larger tier would spend a megabyte on a fingernail.
   */
  function faceOf(speakerId: string | null): string | undefined {
    const ref = speakerId === null ? undefined : faces.get(speakerId);
    return ref ? imageUrl(ref, "thumbnail") : undefined;
  }

  if (scene?.state === "missing") {
    return (
      <Atmosphere>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="font-display text-3xl tracking-wide text-dc-text">Not found</h1>
          <Link to="/" className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text">
            Back to worlds
          </Link>
        </main>
      </Atmosphere>
    );
  }

  const s = scene?.state === "ok" ? scene.data : null;
  const halted = outcome !== null && outcome.halt_reason !== "completed";

  if (s === null) {
    return (
      <Atmosphere>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="font-ui text-dc-text-muted">
            {scene === null ? "Reading the scene…" : "Could not reach the world. Try again."}
          </p>
          <Link
            to="/"
            className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
          >
            Back to worlds
          </Link>
        </main>
      </Atmosphere>
    );
  }

  /* The engine's own halt vocabulary never reaches the screen; a stream failure says so plainly. */
  const statusNote = halted && outcome
    ? haltCopy(outcome.halt_reason)
    : failed
      ? "Could not reach the world. Try again."
      : undefined;

  // History sits above the live transcript in one continuous read: the same card, the same rules,
  // nothing between them to mark where this session started. `groupStageLines` still refuses to fold
  // a remembered line into a live one, so continuity never becomes conflation.
  const stageLines = groupStageLines([...history.lines, ...lines], faceOf);

  return (
    <PlayStage
      worldId={worldId}
      placeLabel={s.place.label}
      placeDescription={s.place.description}
      placeTone={s.place.tone}
      nowLabel={s.now.display_label}
      backdrop={s.place.image ? imageUrl(s.place.image, "final") : undefined}
      offline={scene?.state === "ok" && scene.source === "fixture"}
      participants={s.participants.map((p) => ({
        id: p.id,
        label: p.label,
        face: p.image ? imageUrl(p.image, "thumbnail") : undefined,
        sprites: spriteUrls(p),
        spriteEmotion: speakerEmotion.get(p.id) ?? "neutral",
      }))}
      speakingId={speakingId}
      recentSpeakerIds={recentSpeakerIds}
      lines={stageLines}
      emptyTranscript="Say what you do."
      expanded={expanded}
      onExpandedChange={setExpanded}
      // No affordance for a record that cannot be read: a backend without the transcript endpoint
      // leaves the card exactly as it was before any of this existed.
      historyAvailable={history.available}
      historyLoading={history.loading}
      historyFailed={history.failed}
      historyAtBeginning={atBeginning(history)}
      canLoadOlder={canLoadOlder(history)}
      onLoadOlder={loadOlder}
      statusNote={statusNote}
      input={input}
      pending={pending}
      onInput={setInput}
      onSubmit={onSubmit}
      onContinue={() => void submit("continue", "")}
      aux={
        <>
          <StageIsland label="What matters now" className="px-5 py-5">
            <h2>What matters now</h2>
            {s.current.length === 0 ? (
              <p className="mt-3 font-body italic text-dc-text-muted">Nothing presses in on you.</p>
            ) : (
              <ul className="dc-transcript mt-3 flex max-h-[40vh] list-none flex-col gap-3 overflow-y-auto p-0 pr-2">
                {/* Verbatim, in payload order. Never de-duplicated, filtered or shortened (D-7). */}
                {s.current.map((l, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 font-body text-sm leading-relaxed text-dc-text [overflow-wrap:anywhere]"
                  >
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-dc-accent" />
                    <span className="min-w-0">{l}</span>
                  </li>
                ))}
              </ul>
            )}
          </StageIsland>



          {carrying && (
            <StageIsland label="Carrying now" className="px-5 py-5">
              <h2>Carrying now</h2>
              {carrying.carried.length === 0 ? (
                <p className="mt-3 font-body italic text-dc-text-muted">You have nothing on you.</p>
              ) : (
                <ul className="mt-3 flex list-none flex-col gap-3 p-0">
                  {carrying.carried.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-1 border-b border-dc-border pb-3 last:border-b-0 last:pb-0"
                    >
                      <span className="font-body text-dc-text [overflow-wrap:anywhere]">{c.label}</span>
                      {c.container && (
                        <span className="font-ui text-sm text-dc-text-muted">in your {c.container.label}</span>
                      )}
                      {c.quick_inspect_preview && (
                        <span className="font-body text-sm text-dc-text-muted">{c.quick_inspect_preview}</span>
                      )}
                      {/* A stale carry state keeps its place and says so (Artifacts AC#3). The label
                          is in-world; the tick never renders (B-5). */}
                      {c.decay.stale && (
                        <span className="dc-label text-dc-text-muted">
                          {c.decay.last_confirmed_label
                            ? `last known — not confirmed since ${c.decay.last_confirmed_label}`
                            : "last known — you have not confirmed this recently"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </StageIsland>
          )}
        </>
      }
    />
  );
}
