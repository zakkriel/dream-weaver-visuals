import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme, clearTheme } from "./theme";

const root = () => document.documentElement;

describe("applyTheme — SPEC-019 world tokens", () => {
  beforeEach(() => clearTheme());

  it("puts mood and ornament on <html> as plain data", () => {
    applyTheme({ accent: "#c9a227", mood: "nocturne", ornament: "filigree" });
    expect(root().dataset.mood).toBe("nocturne");
    expect(root().dataset.ornament).toBe("filigree");
  });

  it("derives the accent family from the single colour the payload carries", () => {
    const applied = applyTheme({ accent: "#c9a227", mood: "nocturne", ornament: "none" });

    expect(applied.accent).toBe("#c9a227");
    expect(root().style.getPropertyValue("--dc-accent")).toBe("#c9a227");
    expect(root().style.getPropertyValue("--dc-border-accent")).toBe("#c9a227");
    // 0xc9 * 0.75 = 150.75 → 151, 0xa2 * 0.75 = 121.5 → 122, 0x27 * 0.75 = 29.25 → 29
    expect(root().style.getPropertyValue("--dc-accent-strong")).toBe("rgb(151 122 29)");
    expect(root().style.getPropertyValue("--dc-ring")).toBe("0 0 0 3px rgb(201 162 39 / 0.45)");
  });

  // The one piece of real accessibility work in the theme layer: text on an accent fill has to stay
  // readable whatever colour a world picks, and only the client knows what it draws on top.
  it("picks readable text for the accent fill by luminance", () => {
    applyTheme({ accent: "#111111", mood: "bleak", ornament: "none" });
    expect(root().style.getPropertyValue("--dc-on-accent")).toBe("#ffffff");

    applyTheme({ accent: "#eeeeee", mood: "daylight", ornament: "none" });
    expect(root().style.getPropertyValue("--dc-on-accent")).toBe("#000000");
  });

  // Unknown moods and ornaments are NOT validated here on purpose: the raw value goes on as data and
  // CSS either has a block for it or does not, so an unheard-of word degrades to the base tokens by
  // construction rather than by an allowlist this file would have to keep chasing (GA-3).
  it("passes an unheard-of mood and ornament through untouched", () => {
    applyTheme({ accent: "#c9a227", mood: "thunderhead", ornament: "scrimshaw" });
    expect(root().dataset.mood).toBe("thunderhead");
    expect(root().dataset.ornament).toBe("scrimshaw");
  });

  // Accent IS validated, because unlike the other two it lands inside a CSS value.
  it("refuses an accent that is not a plain #rrggbb, leaving the base accent standing", () => {
    for (const bad of ["red", "#fff", "#12345", "rgb(1,2,3)", "#12345g", "var(--x)"]) {
      clearTheme();
      const applied = applyTheme({ accent: bad, mood: "mist", ornament: "none" });
      expect(applied.accent).toBeNull();
      expect(root().style.getPropertyValue("--dc-accent")).toBe("");
      // A refused accent must not cost the world its mood.
      expect(root().dataset.mood).toBe("mist");
    }
  });

  it("clearTheme puts everything back to the base tokens", () => {
    applyTheme({ accent: "#c9a227", mood: "nocturne", ornament: "filigree" });
    clearTheme();

    expect(root().dataset.mood).toBeUndefined();
    expect(root().dataset.ornament).toBeUndefined();
    for (const name of ["--dc-accent", "--dc-accent-strong", "--dc-ring", "--dc-on-accent"]) {
      expect(root().style.getPropertyValue(name)).toBe("");
    }
  });
});
