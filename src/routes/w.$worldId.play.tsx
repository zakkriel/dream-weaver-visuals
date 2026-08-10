import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
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
import { loadScene, loadCarrying, submitBeat, type Loaded } from "@/api/load";

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

/** One thing that appeared in the narration panel, in the order it appeared. */
type Line =
  | { who: "you"; text: string }
  | { who: "world"; message: NarrationMessage }
  | { who: "note"; text: string };

/**
 * Player-language wording for the engine's halt reasons.
 *
 * The raw vocabulary is engine-facing ("telegraph", "bounce") and must never reach the screen (F-2).
 * `completed` never arrives here.
 */
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

/**
 * Surface 3 — Play.
 *
 * Wiring only: this route decides what data reaches the screen and in what state. Every visual
 * decision here is placeholder Tailwind against the house tokens, waiting for Lovable's play
 * components — see AGENTS.md. Nothing in `components/dc/` was restyled to build it.
 */
/**
 * A face, or the silhouette that stands in for one (D-8).
 *
 * `src` absent is the ordinary state — a picture arriving later is a payload change, never
 * something this client polls for. The `onError` fallback matters just as much: the backend 302s
 * an image path to a short-lived signed URL on a host that can be unreachable, and the rule is
 * that a missing picture reads as *no picture yet*, never as a broken-image glyph or a hole that
 * shifts the layout when art arrives. Either way the frame keeps its size.
 *
 * Decorative by default: on a narration card the speaker's name is the adjacent text, so labelling
 * the face would make a screen reader say it twice.
 */
function Portrait({
  src,
  size,
  active = false,
}: {
  src?: string | undefined;
  size: "sm" | "lg";
  active?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const box = size === "lg" ? "size-16 border-2" : "size-8 border";
  // `inline-flex`, not the default inline: an inline box does not take a width or height, so the
  // frame collapses and the image spills past its own circle.
  return (
    <span
      className={`${box} inline-flex shrink-0 overflow-hidden rounded-full bg-dc-surface-raised ${
        active ? "border-dc-accent" : "border-dc-border"
      }`}
    >
      {src && !broken ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden className="block size-full" />
      )}
    </span>
  );
}

function Play() {
  const { worldId } = Route.useParams();
  const [scene, setScene] = useState<Loaded<Scene> | null>(null);
  const [carrying, setCarrying] = useState<Carrying | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [outcome, setOutcome] = useState<BeatOutcome | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [beatsSettled, setBeatsSettled] = useState(0);

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

  return (
    <Atmosphere>
      {/* The place backdrop. `scene_current/3` added `place.image`; it is null until a world has art,
          and the surface must read with or without it (D-8) — so this is a layer that simply is not
          there when there is no picture, never a reserved hole.

          z-0, NOT a negative z-index: a negatively-stacked child paints behind its ancestor's
          background, and the house atmosphere is an opaque gradient, so the art was invisible. */}
      {s?.place.image && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${imageUrl(s.place.image, "final")})` }}
          />
          {/* The scrim, and it is not decoration. Measured against this world's own backdrop, the
              brightest region (the window) put body text at 3.85:1 — under the 4.5:1 floor. Averaged
              over the frame it was 11.9:1, which is exactly why an average is the wrong test: the
              text lands wherever the layout puts it. This holds the worst tile above the floor while
              leaving the art readable. */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(180deg,rgba(9,13,21,0.72)_0%,rgba(9,13,21,0.55)_45%,rgba(9,13,21,0.78)_100%)]"
          />
        </>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[92rem] gap-6 px-5 py-6">
        <main className="min-w-0 flex-1">
          {scene === null && <p className="font-ui text-dc-text-muted">Reading the scene…</p>}
          {scene?.state === "failed" && (
            <p className="font-ui text-dc-text-muted">Could not reach the world. Try again.</p>
          )}

          {s && (
            <>
              {scene?.state === "ok" && scene.source === "fixture" && (
                <p className="dc-label mb-4 inline-flex rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                  Offline — showing a captured scene
                </p>
              )}

              <h1 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-wide text-dc-accent-strong [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
                {s.place.label}
              </h1>
              {s.place.description && (
                <p className="mt-3 max-w-[58ch] font-body text-lg italic leading-relaxed text-dc-text-muted">
                  {s.place.description}
                </p>
              )}
              {/* The world's own atmosphere words, verbatim. Never mapped to a fixed set or a colour
                  scale — an unheard-of tone must render as plain text. */}
              {s.place.tone && (
                <p className="dc-label mt-3 inline-flex rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                  {s.place.tone}
                </p>
              )}

              {/* Who is present. Two participants may carry the identical label on purpose; they are
                  never numbered on screen. A null image keeps the silhouette — no spinner, no hole. */}
              {s.participants.length > 0 && (
                <ul className="mt-8 flex list-none flex-wrap gap-6 p-0">
                  {s.participants.map((p) => (
                    <li key={p.id} className="flex w-24 flex-col items-center gap-2">
                      <Portrait
                        src={p.image ? imageUrl(p.image, "thumbnail") : undefined}
                        size="lg"
                        active={p.id === speakingId}
                      />
                      <span className="text-center font-ui text-sm text-dc-text-muted">{p.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* The transcript. Grows within a session; rendered in arrival order, never sorted. */}
              <div className="mt-8 flex flex-col gap-4">
                {lines.length === 0 && (
                  <p className="font-body text-dc-text-muted">Say what you do.</p>
                )}
                {lines.map((line, i) => (
                  <div key={i}>
                    {line.who === "you" && (
                      <>
                        <p className="font-ui text-sm text-dc-text-muted">You</p>
                        <p className="font-body text-dc-text">{line.text}</p>
                      </>
                    )}
                    {line.who === "note" && (
                      <p className="font-body text-dc-text-muted">{line.text}</p>
                    )}
                    {line.who === "world" &&
                      (line.message.kind === "narration" ? (
                        // World prose, nobody's voice: no portrait, no name, no card.
                        <p className="font-body text-dc-text">{line.message.text}</p>
                      ) : (
                        <div className="flex items-start gap-3">
                          {/* Decorative: the speaker's name is the adjacent text, so labelling the
                              face would announce it twice. */}
                          <Portrait src={faceOf(line.message.speaker_id)} size="sm" />
                          <div>
                            <p className="font-ui text-sm text-dc-text-muted">
                              {line.message.speaker_label}
                            </p>
                            <p className="font-body text-dc-text">
                              {line.message.kind === "speech"
                                ? `\u201c${line.message.text}\u201d`
                                : line.message.text}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}

                {halted && outcome && (
                  <p className="dc-label inline-flex w-fit rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                    {HALT[outcome.halt_reason] ?? "Something snagged — try again."}
                  </p>
                )}
                {failed && (
                  <p className="font-body text-dc-text-muted">Could not reach the world. Try again.</p>
                )}
              </div>

              <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
                <textarea
                  aria-label="Your action"
                  rows={2}
                  value={input}
                  disabled={pending}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write an action, speak, or type / for options..."
                  className="dc-focus w-full rounded-dc-sm border border-dc-border bg-dc-surface p-3 font-body text-dc-text"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={pending || input.trim() === ""}
                    className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text disabled:opacity-50"
                  >
                    {pending ? "Sending…" : "Send"}
                  </button>
                  {/* Continue advances the moment by one beat and carries no text at all. */}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void submit("continue", "")}
                    className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}
        </main>

        {s && (
          <aside aria-label="Context" className="hidden w-[22rem] shrink-0 flex-col gap-6 xl:flex">
            <section aria-label="Current">
              <h2 className="font-display text-2xl tracking-wide text-dc-text">Current</h2>
              <p className="dc-label mt-2 text-dc-text-muted">What matters now</p>
              {s.current.length === 0 ? (
                <p className="mt-3 font-body italic text-dc-text-muted">Nothing presses in on you.</p>
              ) : (
                <ul className="mt-3 flex list-none flex-col gap-3 p-0">
                  {/* Verbatim, in payload order. Never de-duplicated, filtered or shortened (D-7). */}
                  {s.current.map((l, i) => (
                    <li key={i} className="border-l border-dc-border-accent pl-3 font-body text-sm text-dc-text">
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {carrying && (
              <section aria-label="Carrying now" className="border-t border-dc-border pt-4">
                <h2 className="font-display text-2xl tracking-wide text-dc-text">Carrying now</h2>
                {carrying.carried.length === 0 ? (
                  <p className="mt-3 font-body italic text-dc-text-muted">You have nothing on you.</p>
                ) : (
                  <ul className="mt-3 flex list-none flex-col gap-3 p-0">
                    {carrying.carried.map((c) => (
                      <li key={c.id} className="flex flex-col gap-1 border-b border-dc-border pb-2 last:border-b-0">
                        <span className="font-body text-dc-text">{c.label}</span>
                        {c.container && (
                          <span className="font-ui text-sm text-dc-text-muted">in your {c.container.label}</span>
                        )}
                        {c.quick_inspect_preview && (
                          <span className="font-body text-sm text-dc-text-muted">{c.quick_inspect_preview}</span>
                        )}
                        {/* A stale carry state keeps its place and says so — it never disappears
                            (Artifacts AC#3). The label is in-world; the tick never renders (B-5). */}
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
              </section>
            )}
          </aside>
        )}
      </div>
    </Atmosphere>
  );
}
