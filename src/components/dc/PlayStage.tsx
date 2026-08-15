import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/dc/Portrait";
import { rpSegments } from "@/lib/rp-text";
import { Button } from "@/components/ui/button";
import { playVisualMocks } from "@/components/dc/playVisualMocks";
import fallbackBackdrop from "@/assets/drowned-lantern-backdrop.jpg.asset.json";

export type StageParticipant = {
  readonly id: string;
  readonly label: string;
  readonly face?: string | undefined;
};

/**
 * One voiced segment as the wire shapes it: prose in `text`, spoken words in `quote`.
 *
 * They are separate fields because they are separate things. For an action, `text` is the whole act
 * and `quote` is null. For speech, `quote` is the verbatim words and `text` is only the STAGING
 * around them — "she leans in, her voice dropping" — which is legitimately EMPTY when the line is
 * delivered bare. Rendering `text` unconditionally puts a blank paragraph above half the dialogue.
 */
export type StageVoice = { readonly kind: string; readonly text: string; readonly quote: string | null };

export type StageLine =
  | { readonly who: "you"; readonly text: string }
  | { readonly who: "note"; readonly text: string }
  | {
      readonly who: "world";
      readonly kind: string;
      readonly speakerLabel: string;
      readonly text: string;
      readonly quote: string | null;
      readonly face?: string | undefined;
      /**
       * Further lines from the SAME speaker, in arrival order.
       *
       * The engine streams narration a line at a time as each finishes validating, so one person
       * talking arrives as several frames. The caller groups them; this renders them under one
       * portrait and one name, because three frames from Mara are one person speaking.
       */
      readonly more?: readonly StageVoice[];
    };

/**
 * One attributed line, drawn the way roleplay has always drawn it.
 *
 * **Speech** is the character's own words: attributed, and inside quotation marks so the reader can
 * see where the words start and stop. **Action** is staging — something they DO — and reads as
 * italic prose beside their name, never quoted, because putting quotes around a movement claims they
 * said it.
 *
 * The backend is splitting these structurally (see AGENTS.md — a `beat_frame` re-pin is expected).
 * That changes where `kind` comes from, not what it means here; this is the single place either kind
 * is drawn, so a remembered line and a live line cannot drift apart.
 */
function Voiced({ text, quote }: StageVoice) {
  return (
    <>
      {/* Staging: an act, or the movement around a spoken line. Italic prose, never quoted —
          quotation marks around a movement claim the character said it. Empty for a bare line. */}
      {text !== "" && <p className="dc-action-body">{text}</p>}
      {/* The words themselves, verbatim. The wire sends them without quotation marks; the marks are
          ours, and they are how a reader sees where the speech starts and stops. */}
      {quote !== null && quote !== "" && <p className="dc-speech-body">{`\u201c${quote}\u201d`}</p>}
    </>
  );
}

function toneChips(tone: string | null): string[] {
  if (tone === null) return [];
  return tone.split(/[·,]/).map((item) => item.trim()).filter((item) => item !== "");
}

function SunGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9" />
    </svg>
  );
}

function CompassGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="12" r="8" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z" />
    </svg>
  );
}

function WorldGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.8 3.1 2.8 12.9 0 16M12 4c-2.8 3.1-2.8 12.9 0 16" />
    </svg>
  );
}

function TimelineGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M12 8.2v7.6M6 12h12" />
    </svg>
  );
}

function ActorsGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="12" cy="8" r="3" /><path d="M5.5 19c.6-4 2.8-6 6.5-6s5.9 2 6.5 6M17 6.5a2.5 2.5 0 0 1 0 4.8M19 13.5c1.5.8 2.4 2.3 2.6 4.5" />
    </svg>
  );
}

function LocationGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ArtifactGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
      <path d="m12 3 7 5v8l-7 5-7-5V8zM5 8l7 5 7-5M12 13v8" />
    </svg>
  );
}

function PanelGlyph({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
      {expanded
        ? <path d="m4 9 5-5m6 0 5 5M4 15l5 5m6 0 5-5" />
        : <path d="m9 9-5-5m11 5 5-5M9 15l-5 5m11-5 5 5" />}
    </svg>
  );
}

export function StageIsland({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return <section aria-label={label} className={`dc-island ${className}`}>{children}</section>;
}

export function PlayStage({
  worldId,
  placeLabel,
  placeDescription,
  placeTone,
  nowLabel,
  backdrop,
  participants,
  speakingId,
  lines,
  emptyTranscript,
  statusNote,
  offline,
  input,
  pending,
  onInput,
  onSubmit,
  onContinue,
  aux,
  expanded = false,
  onExpandedChange,
  historyAvailable = false,
  historyLoading = false,
  historyFailed = false,
  historyAtBeginning = false,
  canLoadOlder = false,
  onLoadOlder,
}: {
  worldId: string;
  placeLabel: string;
  placeDescription: string | null;
  placeTone: string | null;
  nowLabel: string | null;
  backdrop?: string | undefined;
  participants: readonly StageParticipant[];
  speakingId: string | null;
  lines: readonly StageLine[];
  emptyTranscript: string;
  statusNote?: string | undefined;
  offline?: boolean;
  input: string;
  pending: boolean;
  onInput: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onContinue: () => void;
  aux: ReactNode;
  /** The dialogue card grown into the full-history view, with its own scroller. */
  expanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  /** False when the backend serves no transcript read. No affordance is offered for it. */
  historyAvailable?: boolean;
  historyLoading?: boolean;
  historyFailed?: boolean;
  /** True once every older page has been read — the reader is at the start of the record. */
  historyAtBeginning?: boolean;
  canLoadOlder?: boolean;
  onLoadOlder?: () => void;
}) {
  const chips = toneChips(placeTone);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [contextTab, setContextTab] = useState<"current" | "previous" | "threads">("current");

  /**
   * Follow the newest line as the beat streams in.
   *
   * The engine now sends narration a line at a time, and this panel is a bounded scroll region, so
   * without this the newest line arrives below the fold and the reader watches a stationary view
   * while the story happens underneath it.
   *
   * It only follows when the reader is already AT the bottom. Someone who has scrolled up is reading
   * back, and yanking them to the newest line mid-sentence is worse than not following at all.
   * `behavior` respects the reduced-motion preference, because a scroll is motion like any other.
   */
  const transcriptRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  /**
   * While our own smooth scroll is animating, the events it fires are not the reader moving.
   *
   * A smooth scroll reports every intermediate position, and each one reads as "not at the bottom" —
   * so the next narration frame to arrive mid-animation declines to follow, and the story settles a
   * screen-length short of where it should. Measured at 98px adrift before this existed.
   */
  const selfScrollingUntil = useRef(0);
  const lastTopRef = useRef(0);

  function scrollToNow(smooth = true) {
    const el = transcriptRef.current;
    if (el === null) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const animated = smooth && !reduced;
    selfScrollingUntil.current = animated ? Date.now() + 1000 : 0;
    lastTopRef.current = el.scrollTop;
    el.scrollTo({ top: el.scrollHeight, behavior: animated ? "smooth" : "auto" });
    atBottomRef.current = true;
    setAtBottom(true);
  }

  /**
   * Keep the reader's place when an older page arrives.
   *
   * Older history is PREPENDED, so the content above the viewport grows and every pixel the reader
   * was looking at slides down by exactly that much. Left alone the view jumps backwards mid-sentence
   * on every page — the classic infinite-scroll lurch, and worse here because the thing that moved is
   * the story. Measuring distance from the BOTTOM instead of the top makes it invariant to whatever
   * was inserted above: restore that distance and the reader has not moved at all.
   */
  const fromBottomRef = useRef<number | null>(null);
  const lineCountRef = useRef(lines.length);
  useEffect(() => {
    const el = transcriptRef.current;
    if (el === null) return;

    // `lines` is rebuilt every render, so this effect runs constantly. Only an actual arrival is
    // interesting — and the distinction matters more than tidiness: consuming the saved position on
    // the render that merely flips "loading" would spend it before the page it was saved for lands,
    // leaving the reader pinned at the top and pulling the entire record in one page at a time.
    const grew = lines.length > lineCountRef.current;
    lineCountRef.current = lines.length;
    if (!grew) return;

    const pending = fromBottomRef.current;
    if (pending !== null) {
      fromBottomRef.current = null;
      el.scrollTop = el.scrollHeight - pending;
      return;
    }

    // Nothing was prepended, so this is the story arriving. Follow it — but only for a reader who is
    // already at the bottom. Someone reading back is yanked by nothing.
    if (atBottomRef.current) scrollToNow();
  }, [lines]);

  /**
   * Open on the newest line.
   *
   * The record loads before the scene does, so this card can MOUNT with the story already in it —
   * and a card that mounts full never sees its line count grow, so the follow below never fires. Left
   * alone the player lands in the middle of last week's conversation every time they enter a world.
   */
  useEffect(() => {
    scrollToNow(false);
    // Mount only: every later arrival is handled by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sending is an act of being present.
   *
   * A reader deep in the record who types and sends has just declared where they are, so this is the
   * one moment a jump to now is what they asked for — otherwise their own words land somewhere they
   * cannot see, and the world answers off screen.
   */
  useEffect(() => {
    if (pending) scrollToNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  /**
   * Ask for the page before this one when the reader reaches the top.
   *
   * Only in the expanded view: the docked card is a few lines tall, so its top is always in reach and
   * paging from it would drag the whole record in without anyone asking for it.
   */
  function onTranscriptScroll(el: HTMLDivElement) {
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 4;
    if (Date.now() < selfScrollingUntil.current) {
      // Our own animation, which only ever travels DOWN toward the newest line. A position above the
      // last one is the reader pushing back against it — during a stream the window is refreshed by
      // every frame, so without this check someone scrolling up to re-read would be ignored for as
      // long as the world kept talking. Anything else is the animation and is not the reader leaving.
      if (el.scrollTop >= lastTopRef.current - 2) {
        lastTopRef.current = el.scrollTop;
        if (bottom) selfScrollingUntil.current = 0;
        // It must not trip the load-older check on the way past the top either.
        return;
      }
      selfScrollingUntil.current = 0;
    }
    lastTopRef.current = el.scrollTop;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (expanded && canLoadOlder && el.scrollTop <= 48) {
      fromBottomRef.current = el.scrollHeight - el.scrollTop;
      onLoadOlder?.();
    }
  }

  return (
    <div className="dc-stage-root" data-context-expanded={contextExpanded ? "true" : "false"}>
      <div
        aria-hidden
        className="dc-stage-art"
        // The world's own backdrop sits on top; the house plate sits under it, so a scene whose
        // picture cannot be fetched still opens on atmosphere rather than a black rectangle.
        style={{
          backgroundImage:
            backdrop === undefined
              ? `url(${fallbackBackdrop.url})`
              : `url(${backdrop}), url(${fallbackBackdrop.url})`,
        }}
      />

      <div aria-hidden className="dc-stage-scrim" />
      <div aria-hidden className="dc-stage-grain" />

      <div className="dc-stage-grid">
        <nav aria-label="World navigation" className="dc-island dc-rail">
          <Link to="/" aria-label="Worlds" className="dc-rail-home dc-focus">
            <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.35">
              <path d="m6 7 5 5-5 5M12 7l5 5-5 5" />
            </svg>
          </Link>
          <span aria-hidden className="dc-rail-hair" />
          <Link to="/w/$worldId/play" params={{ worldId }} className="dc-rail-item dc-focus" data-status="active">
            <WorldGlyph /><span>Play</span>
          </Link>
          <Button type="button" variant="ghost" className="dc-rail-item dc-focus"><TimelineGlyph /><span>Timeline</span></Button>
          <Button type="button" variant="ghost" className="dc-rail-item dc-focus"><ActorsGlyph /><span>Actors</span></Button>
          <Button type="button" variant="ghost" className="dc-rail-item dc-focus"><LocationGlyph /><span>Locations</span></Button>
          <Button type="button" variant="ghost" className="dc-rail-item dc-focus"><ArtifactGlyph /><span>Artifacts</span></Button>
          <span aria-hidden className="dc-rail-hair dc-rail-hair-bottom" />
        </nav>

        <header className="dc-stage-header">
          <div className="dc-stage-heading">
            <Link to="/w/$worldId" params={{ worldId }} className="dc-focus dc-stage-title">
              {placeLabel}
            </Link>
            <div className="dc-stage-meta">
              {placeTone !== null && <span>{placeTone}</span>}
              {offline === true && <span>Offline — showing a captured scene</span>}
            </div>
          </div>
          <div className="dc-stage-actions">
            {nowLabel !== null && (
              <div className="dc-now-chip">
                <SunGlyph />
                <span>{nowLabel}</span>
              </div>
            )}
            <Button asChild variant="ghost" size="icon" className="dc-top-icon" title="World">
              <Link to="/w/$worldId" params={{ worldId }} aria-label="World"><WorldGlyph /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="dc-top-icon" title="Worlds">
              <Link to="/worlds" aria-label="Worlds"><CompassGlyph /></Link>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="dc-top-icon" aria-label={contextExpanded ? "Dock context panel" : "Expand context panel"} aria-pressed={contextExpanded} title={contextExpanded ? "Dock context panel" : "Expand context panel"} onClick={() => setContextExpanded((value) => !value)}>
              <PanelGlyph expanded={contextExpanded} />
            </Button>
          </div>
        </header>

        <main className="dc-stage-main">
          <div className="dc-stage-main-inner">

            <div className="dc-stage-spacer" />

            {participants.length > 0 && (
            <ul className="dc-cast">
              {participants.map((participant) => {
                const speaking = participant.id === speakingId;
                return (
                  <li key={participant.id} className="dc-cast-member">
                    <span className="dc-cast-portrait-wrap">
                      <Portrait src={participant.face} active={speaking} className="dc-cast-face" />
                      {speaking && (
                        <span aria-hidden className="dc-speak-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M6 10v4M10 6.5v11M14 8.5v7M18 11v2" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span className={`dc-cast-name ${speaking ? "dc-cast-name-active" : ""}`}>{participant.label}</span>
                  </li>
                );
              })}
            </ul>
            )}

            <StageIsland label="The moment" className="dc-dialogue-card">
            {/* The record and the moment are ONE reading. History sits above the live lines in the
                same card with nothing between them, because to the player there is no seam: it is
                all the same story, and only one end of it happens to be arriving now. */}
            {historyAvailable && (
              <div className="dc-transcript-bar">
                <button
                  type="button"
                  className="dc-focus dc-transcript-toggle"
                  aria-expanded={expanded}
                  onClick={() => {
                    const next = !expanded;
                    onExpandedChange?.(next);
                    // Opening lands on the newest line: the reader was looking at now, and the card
                    // growing upward must not leave them staring at the middle of last week.
                    if (next) requestAnimationFrame(() => scrollToNow(false));
                  }}
                >
                  {expanded ? "Close the record" : "Read the whole story"}
                </button>
                {/* The record's own status lives on the bar, OUTSIDE the scroller. Put inside, it
                    prepends and removes a line at the exact moment an older page lands, shifting the
                    text the reader is looking at by its own height. */}
                {expanded && historyLoading && <span className="dc-transcript-status">Reading back…</span>}
                {expanded && historyFailed && (
                  <span className="dc-transcript-status">Could not read the rest of the record.</span>
                )}
                {expanded && !historyLoading && historyAtBeginning && lines.length > 0 && (
                  <span className="dc-transcript-status">The beginning.</span>
                )}
                {expanded && !atBottom && (
                  <button type="button" className="dc-focus dc-transcript-now" onClick={() => scrollToNow()}>
                    Jump to now
                  </button>
                )}
              </div>
            )}

            {/* Every line, in arrival order. Rendering only the last one dropped world text: with
                line-level narration a beat arrives as several frames, so five of six lines flashed
                past and vanished. The world said them; the player has to be able to read them. */}
            <div
              className={`dc-transcript${expanded ? " dc-transcript-expanded" : ""}`}
              ref={transcriptRef}
              onScroll={(e) => onTranscriptScroll(e.currentTarget)}
            >
              {lines.length === 0 && <p className="dc-empty-line">{emptyTranscript}</p>}
              {lines.map((line, i) => (
                <div key={i}>
                  {line.who === "you" && (
                    <div>
                      <p className="dc-line-label">You</p>
                      {/* The player's own asterisks read as staging. Display only — what was sent and
                          what is stored keep every character they were typed with. */}
                      {rpSegments(line.text).map((seg, j) => (
                        <p key={j} className={seg.kind === "action" ? "dc-action-body" : "dc-speech-body"}>
                          {seg.text}
                        </p>
                      ))}
                    </div>
                  )}
                  {line.who === "note" && <p className="dc-note-line">{line.text}</p>}
                  {line.who === "world" && (
                    line.kind === "speech" || line.kind === "action" ? (
                      <div className="dc-speaking-line">
                        <Portrait src={line.face} className="dc-dialogue-face" />
                        <div>
                          <p className="dc-line-label">{line.speakerLabel}</p>
                          <Voiced kind={line.kind} text={line.text} quote={line.quote} />
                          {line.more?.map((m, j) => (
                            <Voiced key={j} kind={m.kind} text={m.text} quote={m.quote} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {line.text !== "" && <p className="dc-note-line">{line.text}</p>}
                        {line.more?.map((m, j) =>
                          m.text === "" ? null : (
                            <p key={j} className="dc-note-line">
                              {m.text}
                            </p>
                          ),
                        )}
                      </>
                    )
                  )}
                </div>
              ))}
              {statusNote !== undefined && <p className="dc-status-note">{statusNote}</p>}
            </div>

            <form onSubmit={onSubmit} className="dc-dock">
              <textarea
                aria-label="Your action"
                rows={2}
                value={input}
                disabled={pending}
                onChange={(event) => onInput(event.target.value)}
                placeholder="Write an action, speak, or type / for options..."
                className="dc-focus dc-input"
              />
              <Button type="submit" disabled={pending || input.trim() === ""} className="dc-btn-gold">
                <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 3 10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6z" /></svg>
                {pending ? "Sending…" : "Send"}
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={onContinue} className="dc-btn-ghost dc-btn-icon" aria-label="Play forward the world" title="Play forward the world">
                <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 5 8 7-8 7zM17 5v14" /></svg>
              </Button>
            </form>
            </StageIsland>
          </div>
        </main>

        <aside aria-label="Context" className="dc-island dc-aux">
          <div className="dc-aux-tabs">
            <Button
              type="button"
              variant="ghost"
              className={`dc-aux-tab${contextTab === "current" ? " dc-aux-tab-active" : ""}`}
              aria-pressed={contextTab === "current"}
              onClick={() => setContextTab("current")}
            >
              Current
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`dc-aux-tab${contextTab === "previous" ? " dc-aux-tab-active" : ""}`}
              aria-pressed={contextTab === "previous"}
              onClick={() => setContextTab("previous")}
            >
              Previously
            </Button>
            <Button type="button" variant="ghost" className={`dc-aux-tab${contextTab === "threads" ? " dc-aux-tab-active" : ""}`} aria-pressed={contextTab === "threads"} onClick={() => setContextTab("threads")}>Open threads</Button>
          </div>
          <div className="dc-aux-scroll" data-tab={contextTab}>
            <div className="dc-aux-current-panel">
              <StageIsland label="Current place" className="dc-current-card">
                <h2><SunGlyph /><span>{placeLabel}</span></h2>
                {placeDescription !== null && <p className="dc-place-description">{placeDescription}</p>}
                {chips.length > 0 && <><div className="dc-panel-divider" /><p className="dc-aux-eyebrow">Atmosphere</p><ul className="dc-tone-list">{chips.map((chip, index) => <li key={index}>{chip}</li>)}</ul></>}
                {nowLabel !== null && <><div className="dc-panel-divider" /><p className="dc-aux-eyebrow">Time</p><p className="dc-context-time"><SunGlyph className="size-4" />{nowLabel}</p></>}
              </StageIsland>
              {aux}
            </div>
            <div className="dc-aux-previous-panel">
              {playVisualMocks.previous.map((item) => <StageIsland key={item.title} label={item.title} className="dc-mock-context-card"><h2>{item.title}</h2><p>{item.detail}</p></StageIsland>)}
            </div>
            <div className="dc-aux-threads-panel">
              {playVisualMocks.threads.map((item) => <StageIsland key={item.title} label={item.title} className="dc-mock-context-card"><h2>{item.title}</h2><p>{item.detail}</p></StageIsland>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}