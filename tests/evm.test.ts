// CFO-7: hand-computed earned-value cases (.plans/tm8-changes-spec.md §2).
import { describe, expect, it } from "vitest";
import { earnedValue, type EvmUsage } from "@/lib/engine/evm";

// 5 people, 2 h each in week 3 and week 4: weeks 3–4 = 20 h.
const people = ["A", "B", "C", "D", "E"];
const usage: EvmUsage[] = people.flatMap((claimNo) => [
  { claimNo, pilotWeek: 3, hours: 2, rate: 55 },
  { claimNo, pilotWeek: 4, hours: 2, rate: 45 },
]);
const base = { places: 11, budgetRate: 50, usage };

describe("earnedValue", () => {
  it("BAC = places × $500 and PV(13) = BAC", () => {
    const r = earnedValue({ ...base, week: 13 });
    expect(r.bac).toBe(5500);
    expect(r.pv).toBe(5500);
  });
  it("PV is 0 and SPI is null before week 3", () => {
    for (const week of [1, 2]) {
      const r = earnedValue({ ...base, week });
      expect(r.pv).toBe(0);
      expect(r.spi).toBeNull();
    }
  });
  it("PV grows by BAC / 11 per week from week 3", () => {
    // 11 places → $5,500; $500 per plan week.
    expect(earnedValue({ ...base, week: 3 }).pv).toBe(500);
    expect(earnedValue({ ...base, week: 4 }).pv).toBe(1000);
    expect(earnedValue({ ...base, week: 8 }).pv).toBe(3000);
  });
  it("EV uses the budget rate; AC uses each row's actual rate", () => {
    // Week 3: 10 h × $50 = $500 EV; 10 h × $55 = $550 AC.
    const w3 = earnedValue({ ...base, week: 3 });
    expect(w3.ev).toBe(500);
    expect(w3.ac).toBe(550);
    expect(w3.spi).toBe(1);
    expect(w3.cpi).toBe(0.91); // 500 / 550
    // Week 4: 20 h → EV $1,000; AC 550 + 10 × 45 = $1,000.
    const w4 = earnedValue({ ...base, week: 4 });
    expect(w4.ev).toBe(1000);
    expect(w4.ac).toBe(1000);
    expect(w4.spi).toBe(1);
    expect(w4.cpi).toBe(1);
  });
  it("SPI falls when care stops while the plan keeps going", () => {
    // Week 8: EV $1,000 vs PV $3,000.
    expect(earnedValue({ ...base, week: 8 }).spi).toBe(0.33);
  });
  it("hides EV, AC, SPI and CPI while fewer than 5 people used care; PV and BAC stay visible", () => {
    const r = earnedValue({ ...base, week: 4, usage: usage.filter((u) => u.claimNo !== "E") });
    expect(r.ev).toEqual({ suppressed: true });
    expect(r.ac).toEqual({ suppressed: true });
    expect(r.spi).toEqual({ suppressed: true });
    expect(r.cpi).toEqual({ suppressed: true });
    expect(r.pv).toBe(1000);
    expect(r.bac).toBe(5500);
  });
  it("CPI is null when nothing has been spent", () => {
    const r = earnedValue({ ...base, week: 5, usage: [] });
    expect(r.cpi).toBeNull();
    expect(r.ev).toEqual({ suppressed: true });
  });
});
