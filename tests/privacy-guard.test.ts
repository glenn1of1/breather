// ENG-4, PRV-2, H1, H6: walk every payload the dashboard role can read and look for leaks.
import { describe, expect, it } from "vitest";
import { buildSnapshots } from "@/lib/aggregate/build-snapshots";
import { generateScenario, EMPLOYER_ID } from "@/lib/seed/generate";
import { isSuppressed, Scenario, type DashboardSnapshot, type SuppressibleNumber } from "@/lib/contracts";
import { DEFAULT_ASSUMPTIONS, DEFAULT_EMPLOYER } from "@/config/defaults";
import type { PilotData } from "@/lib/aggregate/types";
import { liveClaims } from "./helpers/live";

const all: DashboardSnapshot[] = Scenario.options.flatMap((sc) =>
  [0, 3].flatMap((k) => {
    const d = generateScenario(sc);
    d.claims = [...d.claims, ...liveClaims(k)];
    return buildSnapshots(d);
  }),
);

/** Every value in a payload that counts people. */
function personCounts(s: DashboardSnapshot): [string, SuppressibleNumber][] {
  const out: [string, SuppressibleNumber][] = Object.entries(s.counts)
    .filter(([k]) => k !== "places")
    .map(([k, v]) => [`counts.${k}`, v]);
  if (s.report) out.push(["report.activeCaregivers", s.report.activeCaregivers]);
  s.themes.forEach((t) => out.push([`themes.${t.theme}`, t.participantCount]));
  if (s.pilotEnd) out.push(["signals.waitlist", s.pilotEnd.signals.waitlist], ["signals.cameClose", s.pilotEnd.signals.cameClose]);
  return out;
}

describe("privacy guard over every dashboard payload", () => {
  it("no person count shows 1–4", () => {
    for (const s of all)
      for (const [path, v] of personCounts(s))
        expect(!isSuppressed(v) && v >= 1 && v <= 4, `${s.scenario} week ${s.week} ${path} = ${JSON.stringify(v)}`).toBe(false);
  });

  it("no hidden headline component can be recovered from a visible total (H1)", () => {
    for (const s of all) {
      const c = s.counts;
      const parts = [c.accepted, c.droppedOut, c.waitlisted, c.pending, c.cameClose];
      if (parts.some(isSuppressed)) expect(isSuppressed(c.potentialCaregivers), `${s.scenario} week ${s.week}`).toBe(true);
    }
  });

  it("contains no claim numbers, contact fields or identifying keys", () => {
    for (const s of all) {
      const json = JSON.stringify(s);
      expect(json).not.toMatch(/PH-[0-9A-Z]{4}-\d{2}/);
      expect(json).not.toMatch(/"(contact|q12Contact|claimNo|claim_no|email|phone|name|department)"\s*:/i);
    }
  });

  it("hides means and the verdict inputs when fewer than 5 people contributed (H6)", () => {
    const d: PilotData = {
      employer: { id: EMPLOYER_ID, name: "Tiny Co (fictional)", scenario: "stop", config: DEFAULT_EMPLOYER.config, providerRate: DEFAULT_ASSUMPTIONS.providerRate },
      claims: liveClaims(4),
      checkins: liveClaims(4).map((c) => ({ claimNo: c.claimNo, pilotWeek: 8, q6: 2, q9: "0" as const, q10: 7, q11: 7 })),
      usage: liveClaims(4).flatMap((c) => [3, 4, 5].map((w) => ({ claimNo: c.claimNo, pilotWeek: w, hours: 3, rate: 60, serviceType: "household" as const }))),
      dropOuts: [],
      themes: [],
    };
    const s13 = buildSnapshots(d)[12]!;
    const pe = s13.pilotEnd!;
    expect(isSuppressed(s13.trends.work_impact.baseline)).toBe(true);
    expect(isSuppressed(pe.signals.measures.work_impact.end)).toBe(true);
    expect(isSuppressed(pe.signals.uptake)).toBe(true);
    expect(isSuppressed(pe.costInputs.hoursPerCaregiverPerMonth.mean)).toBe(true);
    expect(pe.signals.improvedCount).toBe(0); // no improvement claimed from 4 people
    expect(s13.usage.weekly.every((w) => isSuppressed(w.hours) || w.hours === 0)).toBe(true);
    // CFO-7: EV, AC, SPI and CPI come from 4 people's usage; only the plan values show.
    expect(s13.evm.ev).toEqual({ suppressed: true });
    expect(s13.evm.ac).toEqual({ suppressed: true });
    expect(s13.evm.spi).toEqual({ suppressed: true });
    expect(s13.evm.cpi).toEqual({ suppressed: true });
    expect(s13.evm).toMatchObject({ bac: 6000, pv: 6000 });
  });

  it("earned value is all hidden or all shown together, so no figure can be derived from another (CFO-7)", () => {
    for (const s of all) {
      const usage = [s.evm.ev, s.evm.ac, s.evm.spi, s.evm.cpi].filter((v) => v !== null);
      const hidden = usage.filter(isSuppressed).length;
      expect(hidden === 0 || hidden === usage.length, `${s.scenario} week ${s.week} ${JSON.stringify(s.evm)}`).toBe(true);
    }
  });
});
