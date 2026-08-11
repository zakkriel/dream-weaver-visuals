import type { FormEvent, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/dc/Portrait";

/**
 * Surface 3 — the play stage, as pixels.
 *
 * Four floating glass islands on a 20px gutter over the scene: a top bar, a left icon rail, the
 * centre stage where the cast stands bottom-anchored above one dialogue card, and the aux column.
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
        <div aria-hidden className="dc-stage-fallback pointer-events-none fixed inset-0 z-0" />
      )}
      {/* The scrim is not decoration: measured against a real backdrop the brightest tile put body
          text under the 4.5:1 floor. This holds the worst tile above it and still shows the art. */}
      <div aria-hidden className="dc-stage-scrim pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 grid min-h-screen grid-cols-[auto_minmax(0,1fr)] gap-[var(--dc-gutter)] p-[var(--dc-gutter)] xl:grid-cols-[auto_minmax(0,1fr)_330px]">
        {/* The rail. Only destinations that exist: a dead nav item is a promise the product
            cannot keep. */}
        <nav aria-label="Go to" className="dc-island flex w-[84px] flex-col items-center gap-4 py-5">
          <Link to="/" aria-label="Worlds" className="dc-rail-btn dc-focus">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5 10.6 10.6 8.5 15.5l4.9-2.1z" />
            </svg>
          </Link>
          <span aria-hidden className="dc-rail-hair" />
          <Link
            to="/w/$worldId"
            params={{ worldId }}
            aria-label="This world"
            className="dc-rail-btn dc-focus"
          >
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
            </svg>
          </Link>
        </nav>

        <main className="flex min-w-0 flex-col gap-[var(--dc-gutter)]">
          <StageIsland label="Where you are" className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="dc-stage-title font-display leading-tight tracking-wide [overflow-wrap:anywhere]">
                  {placeLabel}
                </h1>
                {chips.length > 0 && (
                  <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                    {chips.map((t, i) => (
                      <li key={i} className="dc-chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {offline === true && <span className="dc-chip">Offline — showing a captured scene</span>}
                {nowLabel !== null && <span className="dc-chip dc-chip-accent">{nowLabel}</span>}
              </div>
            </div>
          </StageIsland>

          {/* The stage proper: prose at the top, the cast bottom-anchored over the art. */}
          <div className="relative flex min-h-[16rem] flex-1 flex-col justify-between gap-6 px-2">
            {placeDescription !== null && (
              <p className="max-w-[58ch] font-body text-lg italic leading-relaxed text-dc-text [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
                {placeDescription}
              </p>
            )}

            {participants.length > 0 && (
              <ul className="flex list-none flex-wrap items-end justify-center gap-8 p-0">
                {/* Two participants may carry the identical label on purpose; they are never
                    numbered on screen. */}
                {participants.map((p) => (
                  <li key={p.id} className="flex w-28 flex-col items-center gap-2">
                    <Portrait src={p.face} active={p.id === speakingId} className="size-[92px]" />
                    <span className="text-center font-ui text-sm leading-snug text-dc-text [overflow-wrap:anywhere] [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">
                      {p.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <StageIsland label="The moment" className="dc-dialogue px-6 py-5">
            <div className="dc-transcript flex max-h-[34vh] flex-col gap-4 overflow-y-auto pr-2">
              {lines.length === 0 && <p className="font-body text-dc-text-muted">{emptyTranscript}</p>}
              {lines.map((line, i) => (
                <div key={i}>
                  {line.who === "you" && (
                    <>
                      <p className="dc-label text-dc-accent-strong">You</p>
                      <p className="font-body text-[1.05rem] leading-relaxed text-dc-text [overflow-wrap:anywhere]">
                        {line.text}
                      </p>
                    </>
                  )}
                  {line.who === "note" && (
                    <p className="font-body text-dc-text-muted [overflow-wrap:anywhere]">{line.text}</p>
                  )}
                  {line.who === "world" &&
                    (line.kind === "speech" || line.kind === "action" ? (
                      <div className="flex items-start gap-3">
                        <Portrait src={line.face} className="size-10" />
                        <div className="min-w-0">
                          <p className="font-ui text-sm text-dc-accent-strong [overflow-wrap:anywhere]">
                            {line.speakerLabel}
                          </p>
                          <p className="font-body text-[1.05rem] leading-relaxed text-dc-text [overflow-wrap:anywhere]">
                            {line.kind === "speech" ? `\u201c${line.text}\u201d` : line.text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // World prose, nobody's voice: no portrait, no name, no card.
                      <p className="font-body text-[1.05rem] leading-relaxed text-dc-text [overflow-wrap:anywhere]">
                        {line.text}
                      </p>
                    ))}
                </div>
              ))}
              {statusNote !== undefined && <p className="dc-chip w-fit">{statusNote}</p>}
            </div>

            <span aria-hidden className="dc-hair my-4 block" />

            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                aria-label="Your action"
                rows={2}
                value={input}
                disabled={pending}
                onChange={(e) => onInput(e.target.value)}
                placeholder="Write an action, speak, or type / for options..."
                className="dc-focus dc-input min-w-0 flex-1 resize-none font-body text-dc-text"
              />
              <div className="flex shrink-0 gap-3">
                <button
                  type="submit"
                  disabled={pending || input.trim() === ""}
                  className="dc-focus dc-btn-ghost disabled:opacity-50"
                >
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
              </div>
            </form>
          </StageIsland>
        </main>

        <aside aria-label="Context" className="hidden min-w-0 flex-col gap-[var(--dc-gutter)] xl:flex">
          {aux}
        </aside>
      </div>
    </div>
  );
}
