import type { WorldTheme } from "@/types/world_directory";

/**
 * Derives the per-world accent triplet from `theme.accent`.
 *
 * Nothing is hand-picked per world. A missing or malformed accent falls back
 * to the house tokens, so a world whose theme is refused still renders.
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function expand(hex: string): [number, number, number] | null {
  if (!HEX.test(hex)) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function lighten(rgb: [number, number, number], amount: number): string {
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * amount));
  return `rgb(${r} ${g} ${b})`;
}

export interface AccentVars {
  "--dc-world-accent": string;
  "--dc-world-accent-strong": string;
  "--dc-world-on-accent": string;
  "--dc-world-accent-rgb": string;
}

/** Returns inline CSS custom properties, or an empty object to keep house tokens. */
export function worldAccentVars(theme: WorldTheme | null | undefined): Partial<AccentVars> {
  const rgb = theme?.accent ? expand(theme.accent) : null;
  if (!rgb) return {};
  const luminance = relativeLuminance(rgb);
  return {
    "--dc-world-accent": `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`,
    "--dc-world-accent-strong": lighten(rgb, 0.28),
    "--dc-world-on-accent": luminance > 0.45 ? "#12100a" : "#fdf8ec",
    "--dc-world-accent-rgb": `${rgb[0]} ${rgb[1]} ${rgb[2]}`,
  };
}

/**
 * Mood and ornament are engine vocabulary: they steer atmosphere only and are
 * never printed. Unknown words are passed through and simply match no rule.
 */
export function worldAtmosphereAttrs(theme: WorldTheme | null | undefined) {
  return {
    "data-mood": theme?.mood ?? undefined,
    "data-ornament": theme?.ornament ?? undefined,
  };
}
