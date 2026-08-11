import type { FormEvent, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/dc/Portrait";
import houseHaze from "@/assets/sky-hero.jpg";

/**
 * Surface 3 — the play stage, as pixels.
 *
 * Four floating glass islands on a 20px gutter over the scene: a 100px icon rail inset from the
 * left, a top bar, a centre stage where the cast stands bottom-anchored above one dialogue card,
 * and a 340px aux column on the right.
 *
 * Purely presentational. Every visible string arrives as a prop that mirrors a payload field, and
 * the component never edits, orders, folds or shortens one. When there is no backdrop picture the
 * stage falls back to house atmosphere — the composition is designed for that case, not patched
 * for it.
 */

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

/**
 * The world's own atmosphere words, split on the separators the payload uses and rendered verbatim.
 * Splitting is layout, not editing: no word is mapped to a fixed set, an icon or a colour scale.
 */
function toneChips(tone: string | null): string[] {
  if (tone === null) return [];
  return tone
    .split(/[·,]/)
    .map((t) => t.trim())
    .filter((t) => t !== "");
}

function SunGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" />
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
  return (
    <section aria-label={label} className={`dc-island ${className}`}>
      {children}
    </section>
  );
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
  onSubmit: (e: FormEvent) => void;
  onContinue: () => void;
  aux: ReactNode;
}) {
  const chips = toneChips(placeTone);

  return (
    <div className="dc-stage-root">
      {/* The scene. A picture when the payload carries one, house atmosphere when it does not —
          both are grounds the islands were designed to sit on. */}
      {backdrop !== undefined ? (
        <div
          aria-hidden
          className="dc-stage-art pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      ) : (
        <>
          <div aria-hidden className="dc-stage-fallback pointer-events-none fixed inset-0 z-0" />
          {/* House atmosphere, blurred past depiction: it never claims to show this place. */}
          <div
            aria-hidden
            className="dc-stage-haze pointer-events-none fixed inset-0 z-0"
            style={{ ["--dc-stage-haze-image" as string]: `url(${houseHaze})` }}
          />
        </>
      )}
      {/* The scrim is not decoration: measured against a real backdrop the brightest tile put body
          text under the 4.5:1 floor. This holds the worst tile above it and still shows the art. */}
      <div aria-hidden className="dc-stage-scrim pointer-events-none fixed inset-0 z-0" />
      <div aria-hidden className="dc-grain pointer-events-none fixed inset-0 z-0" />

      <div className="dc-stage-grid relative z-10">
        {/* The rail. Only destinations that exist: a dead nav item is a promise the product
            cannot keep. */}
        <nav aria-label="Go to" className="dc-island dc-rail hidden lg:flex">
          <span aria-hidden className="dc-rail-mark">
            <SunGlyph className="size-6" />
          </span>
          <span aria-hidden className="dc-rail-hair" />
          <Link to="/" aria-label="Worlds" className="dc-rail-item dc-focus">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5 10.6 10.6 8.5 15.5l4.9-2.1z" />
            </svg>
            <span className="dc-rail-label">Worlds</span>
          </Link>
          <Link
            to="/w/$worldId"
            params={{ worldId }}
            aria-label="This world"
            className="dc-rail-item dc-focus"
          >
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
            </svg>
            <span className="dc-rail-label">World</span>
          </Link>
          <span aria-hidden className="dc-rail-hair mt-auto" />
        </nav>

        <main className="dc-stage-main">
          {/* top bar — the place, its atmosphere words, and the world's own clock */}
          <StageIsland label="Where you are" className="dc-topbar">
            <div className="min-w-0">
              <h1 className="dc-stage-title font-display leading-tight tracking-wide [overflow-wrap:anywhere]">
                {placeLabel}
              </h1>
              {chips.length > 0 && (
                <ul className="mt-1.5 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 font-ui text-sm text-dc-text-muted">
                  {chips.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 [overflow-wrap:anywhere]">
                      {i > 0 && <span aria-hidden className="dc-dot" />}
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
              {offline === true && <span className="dc-chip">Offline — showing a captured scene</span>}
              {nowLabel !== null && (
                <span className="dc-now-chip">
                  <SunGlyph className="size-5 text-dc-accent-strong" />
                  <span className="font-ui text-sm leading-tight text-dc-text [overflow-wrap:anywhere]">
                    {nowLabel}
                  </span>
                </span>
              )}
            </div>
          </StageIsland>

          {/* The stage proper: the cast bottom-anchored over the art, nothing between them. */}
          <div className="dc-stage-floor">
            {participants.length > 0 && (
              <ul className="dc-cast">
                {/* Two participants may carry the identical label on purpose; they are never
                    numbered on screen. */}
                {participants.map((p) => {
                  const speaking = p.id === speakingId;
                  return (
                    <li key={p.id} className="dc-cast-member">
                      <span className="relative inline-flex">
                        <Portrait src={p.face} active={speaking} className="dc-cast-face" />
                        {speaking && (
                          <span aria-hidden className="dc-speak-badge">
                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M6 10v4M10 6.5v11M14 8.5v7M18 11v2" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span
                        className={`dc-cast-name ${speaking ? "text-dc-accent-strong" : "text-dc-text"}`}
                      >
                        {p.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <StageIsland label="The moment" className="dc-dialogue dc-dialogue-card">
            <div className="dc-transcript flex flex-col gap-5 overflow-y-auto pr-2">
              {lines.length === 0 && (
                <p className="font-body text-lg italic leading-relaxed text-dc-text-muted">
                  {emptyTranscript}
                </p>
              )}
              {lines.map((line, i) => (
                <div key={i}>
                  {line.who === "you" && (
                    <>
                      <p className="dc-label text-dc-accent-strong">You</p>
                      <p className="dc-speech-body">{line.text}</p>
                    </>
                  )}
                  {line.who === "note" && (
                    <p className="font-body text-dc-text-muted [overflow-wrap:anywhere]">{line.text}</p>
                  )}
                  {line.who === "world" &&
                    (line.kind === "speech" || line.kind === "action" ? (
                      <div className="flex items-start gap-4">
                        <Portrait src={line.face} className="size-[68px] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-ui text-sm tracking-wide text-dc-accent-strong [overflow-wrap:anywhere]">
                            {line.speakerLabel}
                          </p>
                          <p className="dc-speech-body mt-1">
                            {line.kind === "speech" ? `\u201c${line.text}\u201d` : line.text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // World prose, nobody's voice: no portrait, no name, no card.
                      <p className="dc-speech-body font-body italic text-dc-text-muted">{line.text}</p>
                    ))}
                </div>
              ))}
              {statusNote !== undefined && <p className="dc-chip w-fit">{statusNote}</p>}
            </div>

            <form onSubmit={onSubmit} className="dc-dock">
              <textarea
                aria-label="Your action"
                rows={1}
                value={input}
                disabled={pending}
                onChange={(e) => onInput(e.target.value)}
                placeholder="Write an action, speak, or type / for options..."
                className="dc-focus dc-input min-w-0 flex-1 resize-none font-body text-dc-text"
              />
              <button
                type="submit"
                disabled={pending || input.trim() === ""}
                className="dc-focus dc-btn-ghost disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <path d="M21 3 10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6z" />
                </svg>
                {pending ? "Sending…" : "Send"}
              </button>
              {/* Continue advances the moment by one beat and carries no text at all. */}
              <button
                type="button"
                disabled={pending}
                onClick={onContinue}
                className="dc-focus dc-btn-gold disabled:opacity-50"
              >
                Continue
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </form>
          </StageIsland>
        </main>

        <aside aria-label="Context" className="dc-aux hidden xl:flex">
          {/* The scene itself reads here, as it does in the reference: the place, its prose, the
              world's atmosphere words and the world's own clock. All verbatim. */}
          <StageIsland label="Current" className="px-5 py-5">
            <h2 className="flex items-center gap-2 font-display text-xl tracking-wide text-dc-accent-strong">
              <SunGlyph className="size-5" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{placeLabel}</span>
            </h2>
            {placeDescription !== null && (
              <p className="mt-3 font-body leading-relaxed text-dc-text [overflow-wrap:anywhere]">
                {placeDescription}
              </p>
            )}
            {chips.length > 0 && (
              <>
                <p className="dc-aux-eyebrow">Atmosphere</p>
                <ul className="flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 font-ui text-dc-accent-strong">
                  {chips.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 [overflow-wrap:anywhere]">
                      {i > 0 && <span aria-hidden className="dc-dot" />}
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {nowLabel !== null && (
              <>
                <p className="dc-aux-eyebrow">Time</p>
                <p className="flex items-center gap-2 font-ui text-dc-text">
                  <SunGlyph className="size-4 text-dc-accent-strong" />
                  <span className="[overflow-wrap:anywhere]">{nowLabel}</span>
                </p>
              </>
            )}
          </StageIsland>
          {aux}
        </aside>
      </div>
    </div>
  );
}
