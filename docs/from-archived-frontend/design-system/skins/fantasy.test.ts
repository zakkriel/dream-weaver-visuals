import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("fantasy skin", () => {
  const css = readFileSync("src/ds/skins/fantasy.css", "utf8");

  it("scopes overrides under [data-skin=\"fantasy\"]", () => {
    expect(css).toMatch(/\[data-skin="fantasy"\]\s*\{/);
  });

  it("overrides the key contract tokens", () => {
    for (const token of ["--dc-bg", "--dc-accent", "--dc-text", "--dc-font-display"]) {
      expect(css).toContain(token);
    }
  });
});
