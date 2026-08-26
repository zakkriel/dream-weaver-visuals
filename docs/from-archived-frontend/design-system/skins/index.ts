export const SKINS = ["base", "fantasy"] as const;
export type SkinName = (typeof SKINS)[number];
/**
 * The house skin — the one the product actually wears (founder ruling, 2026-08-09).
 *
 * It is declared on `<html>` in `index.html` so the browser has it before any script runs; this
 * constant is the same value for the code paths that need to name it, and a test fails if the two
 * drift. `base` is not dead — it is the neutral fallback the token contract is written against, and
 * the gallery still switches to it — but nothing reaches it by default any more.
 */
export const DEFAULT_SKIN: SkinName = "fantasy";

export function isSkin(s: string | undefined): s is SkinName {
  return s !== undefined && (SKINS as readonly string[]).includes(s);
}

/**
 * Apply a skin to `<html>`. An unknown name falls back to the HOUSE skin, not to `base`: a typo
 * should not drop the whole product into the neutral light theme. Returns the applied skin.
 */
export function setSkin(name: string): SkinName {
  const skin: SkinName = isSkin(name) ? name : DEFAULT_SKIN;
  document.documentElement.dataset.skin = skin;
  return skin;
}

/** The currently applied skin (the house skin when unset or unknown). */
export function getSkin(): SkinName {
  const cur = document.documentElement.dataset.skin;
  return isSkin(cur) ? cur : DEFAULT_SKIN;
}
