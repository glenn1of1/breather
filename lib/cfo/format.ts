// CFO-1..7, SEC-3. Browser-safe formatting for the CFO view: text for "<5" values and the CSV
// downloads. No rules or cost math here; those live in lib/cfo/model.ts (server-only).
import { MIN_GROUP_SIZE } from "@/config/public";
import { isSuppressed, type CfoAssumptions, type CfoGraph, type CostResult, type DashboardSnapshot, type DecisionInput, type SuppressibleNumber } from "@/lib/contracts";

/** Slider values in the design's units: $/h, h/month, places, % and %. */
export type Assumptions = CfoAssumptions;
export type { CfoGraph, DecisionInput };
export type GraphPoint = CfoGraph["points"][number];
/** Month-end snapshots: [month 1 (week 4), month 2 (week 9), month 3 (week 13)]. */
export type MonthSnapshots = [DashboardSnapshot, DashboardSnapshot, DashboardSnapshot];

/** Text for CSV and PDF: hidden values never become numbers. */
export const show = (x: SuppressibleNumber | null | undefined, f = (n: number) => String(n)) => (x === null || x === undefined ? "" : isSuppressed(x) ? `<${MIN_GROUP_SIZE}` : f(x));

export function graphsCsv(graphs: CfoGraph[]) {
  return ["Metric,Month,Value,Unit", ...graphs.flatMap((g) => g.points.map((p) => `"${g.title}",${p.month},${p.value === null ? `<${MIN_GROUP_SIZE} or not available` : p.value},"${g.unit}"`))].join("\n");
}

export function inputsCsv(rows: DecisionInput[]) {
  return ["Input,Baseline,Final,Unit,Target,Status", ...rows.map((r) => `"${r.label}",${show(r.before)},${show(r.after)},"${r.unit}","${r.target}",${r.met === null ? "Context" : r.met ? "Met" : "Below target"}`)].join("\n");
}

export function projectionCsv(cost: CostResult) {
  return ["Month,Low,Base,High", ...cost.band.map((p) => `${p.month},${p.low},${p.base},${p.high}`)].join("\n");
}
