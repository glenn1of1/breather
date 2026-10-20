// Spec §4.4 outcome signals and the suppressed pilot-end form (H3, H6).
import { describe, expect, it } from "vitest";
import { computeOutcomeSignals, toPilotEndSignals, type Participant } from "@/lib/engine/outcomes";
import { isSuppressed } from "@/lib/contracts";

const person = (improve: boolean, hours = 10): Participant => ({
  baseline: { q6: 6, q9: "3-5", q10: 4, q11: 3 },
  end: improve ? { q6: 4, q9: "1-2", q10: 6, q11: 6 } : { q6: 6, q9: "3-5", q10: 4, q11: 3 },
  hours,
});

describe("computeOutcomeSignals", () => {
  it("counts all four measures as improved when everyone improves", () => {
    const s = computeOutcomeSignals({ participants: Array.from({ length: 8 }, () => person(true)), places: 12, waitlist: 6, cameClose: 5 });
    expect(s.improvedCount).toBe(4);
    expect(s.measures.leave_days).toMatchObject({ baseline: 4, end: 1.5, improved: true }); // 62% drop ≥ 25%
    expect(s.uptake).toBeCloseTo(8 / 12);
  });

  it("claims no improvement from fewer than 5 people (H6)", () => {
    const s = computeOutcomeSignals({ participants: Array.from({ length: 4 }, () => person(true)), places: 12, waitlist: 0, cameClose: 0 });
    expect(s.improvedCount).toBe(0);
    const pe = toPilotEndSignals(s);
    expect(isSuppressed(pe.measures.work_impact.baseline)).toBe(true);
    expect(isSuppressed(pe.uptake)).toBe(true);
  });

  it("uptake counts only participants with at least 1 hour, capped at 1", () => {
    const ps = [...Array.from({ length: 6 }, () => person(true, 5)), ...Array.from({ length: 3 }, () => person(true, 0))];
    expect(computeOutcomeSignals({ participants: ps, places: 12, waitlist: 0, cameClose: 0 }).uptake).toBe(0.5);
    expect(computeOutcomeSignals({ participants: ps, places: 3, waitlist: 0, cameClose: 0 }).uptake).toBe(1);
  });

  it("ignores participants with no check-in for the measures", () => {
    const ps = [...Array.from({ length: 5 }, () => person(true)), { ...person(false), end: null }];
    expect(computeOutcomeSignals({ participants: ps, places: 12, waitlist: 0, cameClose: 0 }).measures.work_impact.contributors).toBe(5);
  });
});

describe("toPilotEndSignals (H6)", () => {
  const base = { participants: Array.from({ length: 10 }, () => person(true)), places: 12, cameClose: 5 };
  it.each([
    [8, "scale", true],
    [0, "sustain", false],
    [4, "sustain", false], // a waitlist under N is not "demand exceeds places", and it is hidden
  ] as const)("waitlist %i → %s", (waitlist, category, demand) => {
    const pe = toPilotEndSignals(computeOutcomeSignals({ ...base, waitlist }));
    expect(pe.rulesCategory).toBe(category);
    expect(pe.demandExceedsPlaces).toBe(demand);
    expect(isSuppressed(pe.waitlist)).toBe(waitlist > 0 && waitlist < 5);
  });

  it("stop when uptake is under 60%, even with every measure improved", () => {
    const pe = toPilotEndSignals(computeOutcomeSignals({ participants: Array.from({ length: 6 }, () => person(true)), places: 12, waitlist: 9, cameClose: 0 }));
    expect(pe).toMatchObject({ valueShown: false, rulesCategory: "stop" });
  });
});
