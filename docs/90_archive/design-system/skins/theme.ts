/**
 * SPEC-019 world theme tokens, applied as plain data — the "tokens are the floor" layer of D-15.
 *
 * The backend sends exactly three fields and no palette: one accent colour, an atmosphere word, and an
 * ornament motif. Everything else is derived HERE, because a backend shipping a full palette would own
 * visual design it has no business owning.
 *
 * `mood` and `ornament` are deliberately unconstrained upstream, so this never validates them against a
 * list: the raw value goes onto `<html>` as data, and CSS either has a block for it or does not. An
 * unheard-of mood therefore degrades to the base tokens by construction rather than by an allowlist
 * this file would have to keep chasing. The system never learns the word "fantasy" (GA-3).
 *
 * `accent` is the one field that IS validated, because it lands inside a CSS value: anything that is not
 * a plain `#rrggbb` is ignored and the base accent stands.
 */
export type Theme = { accent: string; mood: string; ornament: string };

/** What actually got applied, so a caller can see when a field was refused. */
export type AppliedTheme = { accent: string | null; mood: string; ornament: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The accent-derived custom properties, and the reason each one exists. */
const ACCENT_VARS = [
  "--dc-accent",
  "--dc-accent-strong",
  "--dc-border-accent",
  "--dc-on-accent",
  "--dc-ring",
] as const;

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Apply a world's theme to `<html>`. Returns what was applied; a refused accent comes back `null`.
 *
 * Derivation, from the single accent the payload carries:
 *  - `--dc-accent-strong` is the same hue pulled 25% toward black, for pressed and hover states.
 *  - `--dc-ring` is the accent at 45% alpha, so focus rings stay legible against any mood's surface.
 *  - `--dc-on-accent` is black or white by relative luminance, so text on an accent fill stays readable
 *    whatever colour a world picks. This is the one piece of real accessibility work in here and it is
 *    why deriving beats letting a backend send five colours it cannot test against our surfaces.
 */
export function applyTheme(theme: Theme): AppliedTheme {
  const root = document.documentElement;

  root.dataset.mood = theme.mood;
  root.dataset.ornament = theme.ornament;

  if (!HEX.test(theme.accent)) {
    for (const name of ACCENT_VARS) root.style.removeProperty(name);
    return { accent: null, mood: theme.mood, ornament: theme.ornament };
  }

  const [r, g, b] = channels(theme.accent);
  const strong = ([r, g, b] as const).map((c) => Math.round(c * 0.75));
  // Relative luminance, sRGB coefficients. Above the usual 0.5 midpoint the accent is light enough
  // that black text reads better on it than white.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  root.style.setProperty("--dc-accent", theme.accent);
  root.style.setProperty("--dc-accent-strong", `rgb(${strong.join(" ")})`);
  root.style.setProperty("--dc-border-accent", theme.accent);
  root.style.setProperty("--dc-on-accent", luminance > 0.5 ? "#000000" : "#ffffff");
  root.style.setProperty("--dc-ring", `0 0 0 3px rgb(${r} ${g} ${b} / 0.45)`);

  return { accent: theme.accent, mood: theme.mood, ornament: theme.ornament };
}

/** Drop every applied theme value, back to the base tokens. For leaving a world. */
export function clearTheme(): void {
  const root = document.documentElement;
  delete root.dataset.mood;
  delete root.dataset.ornament;
  for (const name of ACCENT_VARS) root.style.removeProperty(name);
}
