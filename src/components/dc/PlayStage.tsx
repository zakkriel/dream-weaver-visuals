import type { FormEvent, ReactNode } from "react";
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
  const latestLine = lines.at(-1);

  return (
    <div className="dc-stage-root">
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

        <main className="dc-stage-main">
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
            {nowLabel !== null && (
              <div className="dc-now-chip">
                <SunGlyph />
                <span>{nowLabel}</span>
              </div>
            )}
          </header>

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
            <div className="dc-transcript">
              {lines.length === 0 && <p className="dc-empty-line">{emptyTranscript}</p>}
              {latestLine?.who === "you" && (
                <div><p className="dc-line-label">You</p><p className="dc-speech-body">{latestLine.text}</p></div>
              )}
              {latestLine?.who === "note" && <p className="dc-note-line">{latestLine.text}</p>}
              {latestLine?.who === "world" && (
                latestLine.kind === "speech" || latestLine.kind === "action" ? (
                  <div className="dc-speaking-line">
                    <Portrait src={latestLine.face} className="dc-dialogue-face" />
                    <div>
                      <p className="dc-line-label">{latestLine.speakerLabel}</p>
                      <p className="dc-speech-body">{latestLine.kind === "speech" ? `“${latestLine.text}”` : latestLine.text}</p>
                    </div>
                  </div>
                ) : <p className="dc-note-line">{latestLine.text}</p>
              )}
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
        </main>

        <aside aria-label="Context" className="dc-aux">
          <StageIsland label="Current" className="dc-current-card">
            <h2><SunGlyph /><span>{placeLabel}</span></h2>
            {placeDescription !== null && <p className="dc-place-description">{placeDescription}</p>}
            {chips.length > 0 && (
              <><p className="dc-aux-eyebrow">Atmosphere</p><ul className="dc-tone-list">{chips.map((chip, index) => <li key={index}>{chip}</li>)}</ul></>
            )}
            {nowLabel !== null && (
              <><p className="dc-aux-eyebrow">Time</p><p className="dc-context-time"><SunGlyph className="size-4" />{nowLabel}</p></>
            )}
          </StageIsland>
          {aux}
        </aside>
      </div>
    </div>
  );
}