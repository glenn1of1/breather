// PRD PRE-1, PRE-2, SEC-3. The "Before you join" numbers, exactly as the final UI showed them,
// now computed on the server: the page renders the defaults, the sliders call /api/preview.
import "server-only";
import { PREVIEW_ASSUMPTIONS } from "@/config/defaults";
import type { PreviewRequest, PreviewResult } from "@/lib/contracts";
import { costToContinue } from "./cost";

/** The share slider's value ± this many points gives the caregiver range. */
const SHARE_SPREAD = 2.5;

export function previewEstimate({ headcount, sharePct, places }: PreviewRequest): PreviewResult {
  const low = Math.floor((headcount * Math.max(0, sharePct - SHARE_SPREAD)) / 100);
  const high = Math.ceil((headcount * Math.min(100, sharePct + SHARE_SPREAD)) / 100);
  return {
    potentialCaregivers: { low, high },
    pilotCost: 0,
    costToContinue: costToContinue({ ...PREVIEW_ASSUMPTIONS, places }),
    // High demand: every likely caregiver gets a place and uses it.
    highDemand: costToContinue({ ...PREVIEW_ASSUMPTIONS, places: Math.max(places, high), uptake: 1 }),
  };
}

/** The labelled assumptions shown under the sliders (PRD AI-5), in display units. */
export const previewAssumptionText = () => ({
  rate: PREVIEW_ASSUMPTIONS.providerRate,
  hours: PREVIEW_ASSUMPTIONS.hoursPerCaregiverPerMonth,
  uptakePct: Math.round(PREVIEW_ASSUMPTIONS.uptake * 100),
  adminPct: Math.round(PREVIEW_ASSUMPTIONS.adminFeePct * 100),
});
export type PreviewAssumptionText = ReturnType<typeof previewAssumptionText>;
