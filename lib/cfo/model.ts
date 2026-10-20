// PRD CFO-1..7, SEC-3. The final UI's CFO figures, built only from already-suppressed snapshots (weeks 4, 9
// and 13 = the ends of pilot months 1–3) and the shared cost engine. Server-only: /api/cfo runs these
// and the browser receives results, so the page, the CSV downloads and the ZIP/PDF pack all show the
// same numbers without the rules or the cost model ever reaching the client.
import "server-only";
import { DEFAULT_ASSUMPTIONS, PREVIEW_ASSUMPTIONS } from "@/config/defaults";
import { isSuppressed, type CfoEdits, type CostResult, type DashboardSnapshot, type MeasureKey, type SuppressibleNumber, type VerdictCategory } from "@/lib/contracts";
import { costToContinue } from "@/lib/engine/cost";
import { show, type Assumptions, type CfoGraph, type DecisionInput, type MonthSnapshots } from "./format";

export type { Assumptions, CfoGraph, DecisionInput, MonthSnapshots };

/** The snapshots behind MonthSnapshots: the last week of each pilot month. */
export const MONTH_END_WEEKS = [4, 9, 13] as const;
export const MONTH_WEEKS: [number, number][] = [[1, 4], [5, 9], [10, 13]];
/** Check-ins happen at weeks 4, 8 and 13: one per pilot month. */
const CHECKIN_WEEKS = [4, 8, 13];
const v = (x: SuppressibleNumber | null | undefined): number | null => (x === null || x === undefined || isSuppressed(x) ? null : x);
const round1 = (x: number) => Math.round(x * 10) / 10;

function observed(s13: DashboardSnapshot) {
  const ci = s13.pilotEnd!.costInputs;
  return { uptake: v(ci.uptake), hours: v(ci.hoursPerCaregiverPerMonth.mean), low: v(ci.hoursPerCaregiverPerMonth.p25), high: v(ci.hoursPerCaregiverPerMonth.p75) };
}

/** Defaults from the pilot itself. Scale plans for current places + the waitlist (spec §4.6). */
export function defaultAssumptions(s13: DashboardSnapshot): Assumptions {
  const pe = s13.pilotEnd!;
  const o = observed(s13);
  return {
    rate: DEFAULT_ASSUMPTIONS.providerRate,
    hours: o.hours ?? PREVIEW_ASSUMPTIONS.hoursPerCaregiverPerMonth,
    places: pe.costInputs.places + (pe.signals.rulesCategory === "scale" ? (v(pe.signals.waitlist) ?? 0) : 0),
    uptake: Math.round((o.uptake ?? DEFAULT_ASSUMPTIONS.minUptake) * 100),
    admin: Math.round(DEFAULT_ASSUMPTIONS.adminFeePct * 100),
  };
}

/** CFO-2/3/4: the same costToContinue() as the server; observed P25/P75 hours scale with the hours slider. */
export function costs(a: Assumptions, s13: DashboardSnapshot): CostResult {
  const o = observed(s13);
  const k = o.hours ? a.hours / o.hours : 1;
  return costToContinue(
    {
      providerRate: a.rate,
      hoursPerCaregiverPerMonth: a.hours,
      places: a.places,
      uptake: a.uptake / 100,
      adminFeePct: a.admin / 100,
      hoursLow: o.low !== null ? o.low * k : undefined,
      hoursHigh: o.high !== null ? o.high * k : undefined,
    },
    s13.usage.weekly.map((w) => v(w.hours)),
  );
}

const MEASURES: { k: MeasureKey; label: string; unit: string; target: string }[] = [
  { k: "work_impact", label: "Caregiving impact on work", unit: "1–7 · lower is better", target: "Drop of at least 1 point" },
  { k: "leave_days", label: "Caregiving leave days", unit: "days / month", target: "Drop of at least 25%" },
  { k: "intent_stay", label: "Likely to stay in a year", unit: "1–7", target: "Rise of at least 1 point" },
  { k: "satisfaction", label: "Satisfied with support", unit: "1–7", target: "Reach at least 5 points" },
];

/** CFO-1: the inputs behind the recommendation, baseline → pilot end, against each decision rule. */
export function decisionInputs(s13: DashboardSnapshot): DecisionInput[] {
  const sig = s13.pilotEnd!.signals;
  const uptake = v(sig.uptake);
  return [
    ...MEASURES.map((m) => ({ label: m.label, unit: m.unit, before: sig.measures[m.k].baseline, after: sig.measures[m.k].end, target: m.target, met: sig.measures[m.k].improved })),
    {
      label: "Funded places used",
      unit: "%",
      before: null,
      after: isSuppressed(sig.uptake) ? sig.uptake : Math.round(sig.uptake * 100),
      target: `At least ${Math.round(DEFAULT_ASSUMPTIONS.minUptake * 100)}%`,
      met: uptake === null ? false : uptake >= DEFAULT_ASSUMPTIONS.minUptake,
      percent: true,
    },
    { label: "Waitlist", unit: "people", before: null, after: sig.waitlist, target: sig.demandExceedsPlaces ? "Demand exceeds current places" : "Current places meet demand", met: null },
    { label: "Helped someone, did not qualify", unit: "people", before: null, after: sig.cameClose, target: "Context only", met: null },
  ];
}

/** CFO-7: month-end SPI and CPI (null before anything is planned or spent, or when hidden). */
export function signalTimeline(m: MonthSnapshots) {
  return m.map((s, i) => ({ month: i + 1, spi: v(s.evm.spi), cpi: v(s.evm.cpi) }));
}

/** "What changed" over the pilot (months 1–3) and the 12-month continuation projection. */
export function outcomeGraphs(m: MonthSnapshots, cost: CostResult): CfoGraph[] {
  const s13 = m[2];
  const sig = s13.pilotEnd!.signals;
  const outcomes = MEASURES.map(({ k, label, unit }) => ({
    id: { work_impact: "work-impact", leave_days: "leave-days", intent_stay: "retention", satisfaction: "satisfaction" }[k],
    title: label,
    unit,
    baseline: ((b) => (b === null ? null : round1(b)))(v(sig.measures[k].baseline)),
    points: CHECKIN_WEEKS.map((w, i) => ({ month: i + 1, value: v(s13.trends[k].points.find((p) => p.week === w)?.mean) })),
  }));
  const hoursIn = ([from, to]: [number, number]) => {
    const weeks = s13.usage.weekly.filter((w) => w.week >= from && w.week <= to);
    return round1(weeks.reduce((t, w) => t + (v(w.hours) ?? 0), 0));
  };
  let running = 0;
  return [
    ...outcomes,
    {
      id: "uptake",
      title: "Funded places used",
      unit: "%",
      baseline: null,
      points: m.map((s, i) => {
        const active = v(s.report?.activeCaregivers);
        return { month: i + 1, value: active === null ? null : Math.round((active / s.counts.places) * 100) };
      }),
    },
    { id: "waitlist", title: "Waitlist", unit: "people", baseline: null, points: m.map((s, i) => ({ month: i + 1, value: v(s.counts.waitlisted) })) },
    { id: "hours", title: "Care hours delivered", unit: "hours / month", baseline: null, points: MONTH_WEEKS.map((r, i) => ({ month: i + 1, value: hoursIn(r) })) },
    { id: "monthly-cost", title: "Continuation cost", unit: "$ / month", baseline: null, points: cost.band.map((p) => ({ month: p.month, value: p.base })) },
    { id: "cumulative-cost", title: "Cumulative continuation cost", unit: "$", baseline: null, points: cost.band.map((p) => ({ month: p.month, value: (running += p.base) })) },
  ];
}

const CONCLUSION: Record<VerdictCategory, string> = {
  scale: "Strong outcomes and excess demand support adding places.",
  sustain: "Benefits and sufficient uptake support keeping current capacity.",
  stop: "Low uptake and limited outcome improvement do not support continuing.",
};

export function decisionExplanation(s13: DashboardSnapshot, category: VerdictCategory) {
  const sig = s13.pilotEnd!.signals;
  const waitlist = v(sig.waitlist);
  return `${sig.improvedCount} of 4 outcome targets met; ${show(sig.uptake, (n) => `${Math.round(n * 100)}%`)} of funded places used; ${waitlist === null ? "fewer than 5" : waitlist} ${waitlist === 1 ? "person" : "people"} on the waitlist. ${CONCLUSION[category]}`;
}

/** SEC-3: everything the CFO page shows. `edits` holds slider values per scenario; only the entry for
 * the scenario in the snapshots counts, so switching scenario starts again from the pilot's defaults. */
export function cfoView(months: MonthSnapshots, edits: CfoEdits) {
  const s13 = months[2];
  const defaults = defaultAssumptions(s13);
  const assumptions = edits[s13.scenario] ?? defaults;
  const cost = costs(assumptions, s13);
  return {
    months,
    defaults,
    assumptions,
    cost,
    graphs: outcomeGraphs(months, cost),
    inputs: decisionInputs(s13),
    explanation: { scale: decisionExplanation(s13, "scale"), sustain: decisionExplanation(s13, "sustain"), stop: decisionExplanation(s13, "stop") },
    timeline: signalTimeline(months),
  };
}
