// CFO-2 / CFO-4 / PRE-2: hand-computed cases for spec §4.6.
import { describe, expect, it } from "vitest";
import { costToContinue, monthlyCost } from "@/lib/engine/cost";

const a = { providerRate: 50, hoursPerCaregiverPerMonth: 10, places: 12, uptake: 0.9, adminFeePct: 0.15 };

describe("costToContinue", () => {
  it("base = places × uptake × hours × rate × (1 + fee)", () => {
    // 12 × 0.9 × 10 × 50 × 1.15 = 6,210
    expect(costToContinue(a).monthly.base).toBe(6210);
  });
  it("low uses uptake −15 pts and 0.75× hours; high uses 100% uptake and 1.25× hours", () => {
    const r = costToContinue(a);
    expect(r.monthly.low).toBe(monthlyCost(12, 0.75, 7.5, 50, 0.15)); // 3,881
    expect(r.monthly.high).toBe(monthlyCost(12, 1, 12.5, 50, 0.15)); // 8,625
  });
  it("low ≤ base ≤ high, and annual = 12 × monthly", () => {
    const r = costToContinue(a);
    expect(r.monthly.low).toBeLessThanOrEqual(r.monthly.base);
    expect(r.monthly.base).toBeLessThanOrEqual(r.monthly.high);
    expect(r.annual).toEqual({ low: r.monthly.low * 12, base: r.monthly.base * 12, high: r.monthly.high * 12 });
  });
  it("uses observed P25/P75 hours when given", () => {
    const r = costToContinue({ ...a, hoursLow: 6, hoursHigh: 15 });
    expect(r.monthly.low).toBe(monthlyCost(12, 0.75, 6, 50, 0.15));
    expect(r.monthly.high).toBe(monthlyCost(12, 1, 15, 50, 0.15));
  });
  it("never goes negative at the slider extremes", () => {
    const r = costToContinue({ ...a, uptake: 0.05, hoursPerCaregiverPerMonth: 0, adminFeePct: 0 });
    expect(r.monthly.low).toBe(0);
    expect(r.band.every((p) => p.low >= 0)).toBe(true);
  });
  it("band month 1 base equals the monthly base (CFO-3)", () => {
    expect(costToContinue(a).band[0]!.base).toBe(6210);
  });
});
