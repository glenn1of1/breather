// HR-6: the weekly email never turns a hidden value into a number.
import { describe, expect, it } from "vitest";
import { buildSnapshots } from "@/lib/aggregate/build-snapshots";
import { generateScenario } from "@/lib/seed/generate";
import { weeklyEmail } from "@/lib/email/weekly";

describe("weeklyEmail", () => {
  const snaps = buildSnapshots(generateScenario("scale"));
  it("week 1: hidden trends read 'not enough responses yet'", () => {
    const e = weeklyEmail(snaps[0]!, null);
    expect(e.trends.every((t) => t.change === "not enough responses yet")).toBe(true);
    expect(e.subject).toMatch(/week 1 of 13/);
  });
  it("hidden counts read 'fewer than 5', never 1-4", () => {
    for (let w = 1; w < 13; w++) {
      const e = weeklyEmail(snaps[w]!, snaps[w - 1]!);
      for (const l of e.lines) expect(l.value).not.toMatch(/^[1-4]$|^[1-4] of/);
    }
  });
  it("week 13 reports trend movement in words", () => {
    const e = weeklyEmail(snaps[12]!, snaps[11]!);
    expect(e.trends.some((t) => /\d\.\d/.test(t.change))).toBe(true);
  });
});
