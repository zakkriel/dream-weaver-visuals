import type { ReactNode } from "react";

/**
 * How the Aux slot is presented. One component covers both (SPEC-023: "docked ↔ full-screen via ONE
 * responsive component (bleed-out), not two implementations"), so there is a single Aux render path
 * whatever the presentation — and narrow viewports get the full-screen presentation from CSS alone.
 */
export type AuxMode = "docked" | "full";

/**
 * The neutral skeleton of named slots (SPEC-023, D-15). Every surface in the app is this shell plus
 * slot contents; a theme changes how the slots look and never which slots exist, where they sit, or
 * what they do.
 *
 * The slots, in the spec's own terms: `rail` (left), `bar` (top), `scene` (the canvas), `aux` (right),
 * `input` (bottom), and the main content region as children. `overlay` is the `scene.overlay` seam and
 * `input` doubles as `action.bar`; module UI composes into those named slots later (D-2) — the shell
 * takes rendered nodes, so nothing here knows what a module is, and there is deliberately NO generic
 * fragment renderer (that is deferred to S4 per D-14, and writing one now would create a second
 * rendering path for data that already has a native component).
 *
 * `backdrop` is world art — scene imagery bound to the world (the Image Platform layer of D-15's two
 * atmosphere layers), supplied by the caller. It is content, never part of a theme. Without it the
 * skin's own CSS atmosphere shows through.
 */
export function AppShell({
  rail,
  bar,
  scene,
  overlay,
  aux,
  auxMode = "docked",
  input,
  backdrop,
  children,
}: {
  rail?: ReactNode;
  bar?: ReactNode;
  scene?: ReactNode;
  overlay?: ReactNode;
  aux?: ReactNode;
  auxMode?: AuxMode;
  input?: ReactNode;
  backdrop?: string;
  children?: ReactNode;
}) {
  return (
    <div className="dc-shell">
      {backdrop && (
        <div
          className="dc-shell__backdrop"
          style={{ backgroundImage: `url(${backdrop})` }}
          aria-hidden="true"
        />
      )}
      <div className={`dc-shell__grid${aux == null ? "" : ` dc-shell__grid--aux-${auxMode}`}`}>
        {rail != null && <div className="dc-shell__rail">{rail}</div>}
        {bar != null && <div className="dc-shell__bar">{bar}</div>}
        <main className="dc-shell__main">
          {scene != null && (
            <div className="dc-shell__scene">
              {scene}
              {overlay != null && <div className="dc-shell__overlay">{overlay}</div>}
            </div>
          )}
          {children}
        </main>
        {aux != null && (
          <aside className="dc-shell__aux" aria-label="Context">
            {aux}
          </aside>
        )}
        {input != null && <div className="dc-shell__input">{input}</div>}
      </div>
    </div>
  );
}
