// PRD CFO-2, CFO-4, PRE-2, spec §4.6. One cost function for the CFO view and /preview.
// Pure and server-only (SEC-3): /api/cfo and /api/preview call it; the browser only gets results.
import "server-only";
import type { CostAssumptions, CostResult } from "@/lib/contracts";
import { projectBand } from "./projection";

/** Uptake drop for the low case (spec §4.6: observed − 15 points). */
export const LOW_UPTAKE_DROP = 0.15;

export function monthlyCost(places: number, uptake: number, hours: number, rate: number, adminFeePct: number): number {
  return Math.round(places * uptake * hours * rate * (1 + adminFeePct));
}

/**
 * @param weeklyHours observed care hours per pilot week (index 0 = week 1), null where hidden.
 *   Omit for /preview (no pilot data): the band then uses only the minimum width.
 */
export function costToContinue(a: CostAssumptions, weeklyHours?: (number | null)[]): CostResult {
  const hoursLow = a.hoursLow ?? a.hoursPerCaregiverPerMonth * 0.75;
  const hoursHigh = a.hoursHigh ?? a.hoursPerCaregiverPerMonth * 1.25;
  const base = monthlyCost(a.places, a.uptake, a.hoursPerCaregiverPerMonth, a.providerRate, a.adminFeePct);
  const low = monthlyCost(a.places, Math.max(0, a.uptake - LOW_UPTAKE_DROP), hoursLow, a.providerRate, a.adminFeePct);
  const high = monthlyCost(a.places, 1, hoursHigh, a.providerRate, a.adminFeePct);
  const weeklyCost = (weeklyHours ?? []).map((h) => (h === null ? null : h * a.providerRate * (1 + a.adminFeePct)));
  return {
    monthly: { low, base, high },
    annual: { low: low * 12, base: base * 12, high: high * 12 },
    band: projectBand(weeklyCost, base),
    bandLevel: 0.8,
  };
}
