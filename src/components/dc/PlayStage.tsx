import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/dc/Portrait";
import { Button } from "@/components/ui/button";
import fallbackBackdrop from "@/assets/drowned-lantern-backdrop.jpg.asset.json";

export type StageParticipant = {
  readonly id: string;
  readonly label: string;
  readonly face?: string | undefined;
};

export type StageLine =
  | { readonly who: "you"; readonly text: string }
  | { readonly who: "note"; readonly text: string }
  | {
      readonly who: "world";
      readonly kind: string;
      readonly speakerLabel: string;
      readonly text: string;
      readonly face?: string | undefined;
      /**
       * Further lines from the SAME speaker, in arrival order.
       *
       * The engine streams narration a line at a time as each finishes validating, so one person
       * talking arrives as several frames. The caller groups them; this renders them under one
       * portrait and one name, because three frames from Mara are one person speaking.
       */
      readonly more?: readonly { readonly kind: string; readonly text: string }[];
    };

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
}) {
  const chips = toneChips(placeTone);
  const [contextExpanded, setContextExpanded] = useState(false);

  return (
    <div className="dc-stage-root" data-context-expanded={contextExpanded ? "true" : "false"}>
      <div
        aria-hidden
        className="dc-stage-art"
        style={{ backgroundImage: `url(${backdrop ?? fallbackBackdrop.url})` }}
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
          <Link to="/worlds" className="dc-rail-item dc-focus">
            <CompassGlyph />
            <span>Worlds</span>
          </Link>
          <Link to="/w/$worldId" params={{ worldId }} className="dc-rail-item dc-focus">
            <WorldGlyph />
            <span>World</span>
          </Link>
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
            {/* Every line, in arrival order. Rendering only the last one dropped world text: with
                line-level narration a beat arrives as several frames, so five of six lines flashed
                past and vanished. The world said them; the player has to be able to read them. */}
            <div className="dc-transcript">
              {lines.length === 0 && <p className="dc-empty-line">{emptyTranscript}</p>}
              {lines.map((line, i) => (
                <div key={i}>
                  {line.who === "you" && (
                    <div><p className="dc-line-label">You</p><p className="dc-speech-body">{line.text}</p></div>
                  )}
                  {line.who === "note" && <p className="dc-note-line">{line.text}</p>}
                  {line.who === "world" && (
                    line.kind === "speech" || line.kind === "action" ? (
                      <div className="dc-speaking-line">
                        <Portrait src={line.face} className="dc-dialogue-face" />
                        <div>
                          <p className="dc-line-label">{line.speakerLabel}</p>
                          <p className="dc-speech-body">{line.kind === "speech" ? `“${line.text}”` : line.text}</p>
                          {line.more?.map((m, j) => (
                            <p key={j} className="dc-speech-body">{m.kind === "speech" ? `“${m.text}”` : m.text}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="dc-note-line">{line.text}</p>
                        {line.more?.map((m, j) => <p key={j} className="dc-note-line">{m.text}</p>)}
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
              <Button type="submit" variant="ghost" disabled={pending || input.trim() === ""} className="dc-btn-ghost">
                <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 3 10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6z" /></svg>
                {pending ? "Sending…" : "Send"}
              </Button>
              <Button type="button" disabled={pending} onClick={onContinue} className="dc-btn-gold">
                Continue
                <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
              </Button>
            </form>
            </StageIsland>
          </div>
        </main>

        <aside aria-label="Context" className="dc-island dc-aux">
          <div className="dc-aux-tabs">
            <span className="dc-aux-tab-active">Current</span>
            <Button type="button" variant="ghost" size="icon" className="dc-aux-expand" aria-label={contextExpanded ? "Dock context panel" : "Expand context panel"} onClick={() => setContextExpanded((value) => !value)}>
              <PanelGlyph expanded={contextExpanded} />
            </Button>
          </div>
          <div className="dc-aux-scroll">
            <StageIsland label="Current place" className="dc-current-card">
              <h2><SunGlyph /><span>{placeLabel}</span></h2>
              {placeDescription !== null && <p className="dc-place-description">{placeDescription}</p>}
              {chips.length > 0 && (
                <><div className="dc-panel-divider" /><p className="dc-aux-eyebrow">Atmosphere</p><ul className="dc-tone-list">{chips.map((chip, index) => <li key={index}>{chip}</li>)}</ul></>
              )}
              {nowLabel !== null && (
                <><div className="dc-panel-divider" /><p className="dc-aux-eyebrow">Time</p><p className="dc-context-time"><SunGlyph className="size-4" />{nowLabel}</p></>
              )}
            </StageIsland>
            {aux}
          </div>
        </aside>
      </div>
    </div>
  );
}