// PRE-1, PRE-2, SEC-3: the server's estimate is the final UI's formula (share ± 2.5 points).
import { describe, expect, it } from "vitest";
import { PREVIEW_ASSUMPTIONS } from "@/config/defaults";
import { PREVIEW_START } from "@/config/public";
import { costToContinue } from "@/lib/engine/cost";
import { previewEstimate } from "@/lib/engine/preview";

describe("previewEstimate", () => {
  it("matches the starting sliders: 30–35 caregivers, high demand gives every one a place", () => {
    const r = previewEstimate(PREVIEW_START);
    expect(r.potentialCaregivers).toEqual({ low: 30, high: 35 });
    expect(r.costToContinue).toEqual(costToContinue({ ...PREVIEW_ASSUMPTIONS, places: 12 }));
    expect(r.highDemand).toEqual(costToContinue({ ...PREVIEW_ASSUMPTIONS, places: 35, uptake: 1 }));
  });

  it("rounds the range outwards and keeps places when they exceed demand", () => {
    const r = previewEstimate({ headcount: 25, sharePct: 30, places: 15 });
    expect(r.potentialCaregivers).toEqual({ low: 6, high: 9 }); // floor(6.875), ceil(8.125)
    expect(r.highDemand).toEqual(costToContinue({ ...PREVIEW_ASSUMPTIONS, places: 15, uptake: 1 }));
  });
});
