import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { setSkin, getSkin, DEFAULT_SKIN, isSkin } from "./index";

describe("skin registry", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.skin;
  });

  it("defaults to the house skin", () => {
    expect(DEFAULT_SKIN).toBe("fantasy");
    expect(getSkin()).toBe("fantasy");
  });

  it("setSkin applies a valid skin to <html> and returns it", () => {
    expect(setSkin("base")).toBe("base");
    expect(document.documentElement.dataset.skin).toBe("base");
    expect(getSkin()).toBe("base");
  });

  // A typo must not drop the product into the neutral light theme.
  it("setSkin falls back to the house skin for an unknown name", () => {
    expect(setSkin("noir")).toBe("fantasy");
    expect(getSkin()).toBe("fantasy");
  });

  it("isSkin narrows known names only", () => {
    expect(isSkin("fantasy")).toBe(true);
    expect(isSkin("nope")).toBe(false);
  });
});

/**
 * The house skin is declared twice by necessity — as an attribute in the document the browser parses
 * (so there is no frame of light theme before the bundle runs) and as the constant the code names.
 * Neither can be derived from the other at build time, so this is the thing that keeps them honest.
 */
describe("the house skin is declared once, in two places that must agree", () => {
  const html = readFileSync("index.html", "utf8");

  it("index.html carries data-skin on <html>", () => {
    expect(html).toMatch(/<html[^>]*\sdata-skin="[^"]+"/);
  });

  it("the markup's skin is exactly DEFAULT_SKIN", () => {
    const found = /<html[^>]*\sdata-skin="([^"]+)"/.exec(html)?.[1];
    expect(found).toBe(DEFAULT_SKIN);
  });
});
