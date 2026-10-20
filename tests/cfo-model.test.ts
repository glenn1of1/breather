// CFO-1..7 in the final UI: the CFO figures come only from suppressed snapshots and the shared cost engine.
import { describe, expect, it } from "vitest";
import { buildSnapshots } from "@/lib/aggregate/build-snapshots";
import { cfoView, costs, decisionExplanation, decisionInputs, defaultAssumptions, outcomeGraphs, signalTimeline, type MonthSnapshots } from "@/lib/cfo/model";
import { graphsCsv, inputsCsv } from "@/lib/cfo/format";
import { costToContinue } from "@/lib/engine/cost";
import { generateScenario } from "@/lib/seed/generate";
import { CfoView, type Scenario } from "@/lib/contracts";

const months = (sc: Scenario): MonthSnapshots => {
  const s = buildSnapshots(generateScenario(sc));
  return [s[3]!, s[8]!, s[12]!];
};

describe("CFO model", () => {
  it("defaults start from the pilot: observed hours and uptake; scale adds the waitlist to places", () => {
    const [, , s13] = months("scale");
    const a = defaultAssumptions(s13);
    expect(a).toMatchObject({ rate: 50, places: 20, admin: 15 });
    expect(a.hours).toBe(s13.pilotEnd!.costInputs.hoursPerCaregiverPerMonth.mean);
    expect(a.uptake).toBe(92);
    expect(defaultAssumptions(months("sustain")[2]).places).toBe(12);
  });

  it("uses the same costToContinue() as the server", () => {
    const [, , s13] = months("sustain");
    const a = defaultAssumptions(s13);
    const direct = costToContinue(
      {
        providerRate: 50,
        hoursPerCaregiverPerMonth: a.hours,
        places: 12,
        uptake: a.uptake / 100,
        adminFeePct: 0.15,
        hoursLow: s13.pilotEnd!.costInputs.hoursPerCaregiverPerMonth.p25 as number,
        hoursHigh: s13.pilotEnd!.costInputs.hoursPerCaregiverPerMonth.p75 as number,
      },
      s13.usage.weekly.map((w) => (typeof w.hours === "number" ? w.hours : null)),
    );
    expect(costs(a, s13)).toEqual(direct);
  });

  it("decision inputs match the pilot-end signals, including the verdict's rule results", () => {
    const [, , s13] = months("scale");
    const rows = decisionInputs(s13);
    expect(rows).toHaveLength(7);
    expect(rows.slice(0, 4).filter((r) => r.met).length).toBe(s13.pilotEnd!.signals.improvedCount);
    expect(rows[4]).toMatchObject({ label: "Funded places used", after: 92, met: true });
    expect(rows[5]).toMatchObject({ label: "Waitlist", after: 8, target: "Demand exceeds current places" });
  });

  it("SPI/CPI are the month-end earned values (weeks 4, 9, 13)", () => {
    const m = months("stop");
    const t = signalTimeline(m);
    expect(t.map((x) => x.month)).toEqual([1, 2, 3]);
    expect(t[2]).toEqual({ month: 3, spi: m[2].evm.spi, cpi: m[2].evm.cpi });
  });

  it("graphs: 9 series; hidden counts stay null and become '<5' in CSV", () => {
    const m = months("scale");
    const graphs = outcomeGraphs(m, costs(defaultAssumptions(m[2]), m[2]));
    expect(graphs.map((g) => g.id)).toEqual(["work-impact", "leave-days", "retention", "satisfaction", "uptake", "waitlist", "hours", "monthly-cost", "cumulative-cost"]);
    const waitlist = graphs.find((g) => g.id === "waitlist")!;
    expect(waitlist.points.map((p) => p.value)).toEqual(m.map((s) => (typeof s.counts.waitlisted === "number" ? s.counts.waitlisted : null)));
    for (const g of graphs) for (const p of g.points) if (p.value !== null && ["waitlist"].includes(g.id)) expect(p.value === 0 || p.value >= 5).toBe(true);
    expect(graphsCsv(graphs)).not.toMatch(/PH-[0-9A-Z]{4}-\d{2}/);
  });

  it("never prints a hidden value as a number in CSV", () => {
    const [, , s13] = months("stop");
    const hidden = { ...s13, pilotEnd: { ...s13.pilotEnd!, signals: { ...s13.pilotEnd!.signals, waitlist: { suppressed: true as const } } } };
    expect(inputsCsv(decisionInputs(hidden))).toContain('"Waitlist",,<5,');
  });

  it("cfoView (SEC-3) returns the same numbers the page used to compute, and validates as a CfoView", () => {
    const m = months("sustain");
    const edit = { rate: 80, hours: 6.5, places: 30, uptake: 55, admin: 10 };
    const view = cfoView(m, { sustain: edit });
    expect(CfoView.parse(view)).toEqual(view);
    expect(view.defaults).toEqual(defaultAssumptions(m[2]));
    expect(view.assumptions).toEqual(edit);
    expect(view.cost).toEqual(costs(edit, m[2]));
    expect(view.graphs).toEqual(outcomeGraphs(m, costs(edit, m[2])));
    expect(view.inputs).toEqual(decisionInputs(m[2]));
    expect(view.explanation.stop).toBe(decisionExplanation(m[2], "stop"));
  });

  it("cfoView ignores edits made for another scenario", () => {
    const m = months("scale");
    const view = cfoView(m, { sustain: { rate: 80, hours: 6.5, places: 30, uptake: 55, admin: 10 } });
    expect(view.assumptions).toEqual(defaultAssumptions(m[2]));
  });
});
