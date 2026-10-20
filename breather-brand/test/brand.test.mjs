// Guards the brand rules: every approved text pairing passes WCAG AA, employer themes stay inside
// the guardrails, and the privacy rule hides groups under 5. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tokens, themes, contrastRatio, meetsAA, suppress, checkEmployerTheme, employerStyle } from "../src/index.js";

const c = tokens.colors;

test("approved normal-size text pairings pass 4.5:1", () => {
  const pairs = [
    ["plum", "page"], ["plum", "card"], ["plum", "red-tint"], ["plum", "teal-tint"], ["plum", "plum-tint"], ["plum", "soft-sage"], ["plum", "white"],
    ["se-red-deep", "page"], ["se-red-deep", "card"], ["se-red-deep", "red-tint"], ["se-red-deep", "white"],
    ["teal-deep", "page"], ["text-grey", "page"],
    ["white", "se-red"], ["white", "plum"], ["white", "sidebar-active"], ["sidebar-label", "plum"],
  ];
  for (const [fg, bg] of pairs) {
    assert.ok(meetsAA(c[fg], c[bg]), `${fg} on ${bg} is ${contrastRatio(c[fg], c[bg]).toFixed(2)}:1`);
  }
});

test("white on teal is large text only (3:1)", () => {
  assert.ok(meetsAA(c.white, c.teal, { large: true }));
});

test("text grey is not allowed on cards or tints", () => {
  for (const bg of ["card", "red-tint", "teal-tint", "plum-tint", "soft-sage"]) {
    assert.ok(!meetsAA(c["text-grey"], c[bg]), `text-grey on ${bg} unexpectedly passes; update the guidelines`);
  }
});

test("chart series are distinguishable from the page (3:1 for graphics)", () => {
  for (const s of tokens.chart.series) assert.ok(contrastRatio(s, c.page) >= 3, s);
});

test("exactly five type styles and a 12px floor", () => {
  assert.deepEqual(Object.keys(tokens.type), ["display", "headline", "title", "body", "label"]);
  for (const style of Object.values(tokens.type)) {
    assert.ok(style.fontWeight >= 400, "no weights below 400");
    const rem = /^([\d.]+)rem$/.exec(style.fontSize);
    if (rem) assert.ok(Number(rem[1]) * 16 >= tokens.typeFloorPx);
  }
});

test("no shadows in the component CSS", () => {
  const css = readFileSync(new URL("../css/breather.css", import.meta.url), "utf8");
  assert.ok(!/box-shadow|text-shadow|gradient\(/.test(css));
});

test("bundled employer themes follow the guardrails", () => {
  for (const theme of Object.values(themes)) assert.deepEqual(checkEmployerTheme(theme), [], theme.slug);
  assert.equal(employerStyle("northwind")["--br-employer-accent"], themes.northwind.accent);
});

test("a red or unreadable employer accent is refused", () => {
  assert.ok(checkEmployerTheme({ slug: "x", name: "X", accent: "#E8202A", accentText: "#FFFFFF", accentTint: "#FBE4E6" }).length > 0);
  assert.ok(checkEmployerTheme({ slug: "y", name: "Y", accent: "#F5D867", accentText: "#FFFFFF", accentTint: "#FFF8DD" }).length > 0);
  assert.throws(() => employerStyle({ slug: "y", name: "Y", accent: "#F5D867", accentText: "#FFFFFF", accentTint: "#FFF8DD" }));
});

test("values from fewer than 5 people are hidden", () => {
  assert.equal(suppress(3), "<5");
  assert.equal(suppress(12), 12);
  assert.equal(suppress(40, 4), "<5");
});
