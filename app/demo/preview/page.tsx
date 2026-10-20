import type { Metadata } from "next";
import { PreviewPage } from "@/components/breather/preview";
import { PREVIEW_START } from "@/config/public";
import { previewAssumptionText, previewEstimate } from "@/lib/engine/preview";

export const metadata: Metadata = { title: "Before You Join · Breather", description: "Estimate what caregiver support could cost your workplace." };

// SEC-3: the first numbers are computed here, on the server; the sliders ask /api/preview.
export default function Page() {
  return <PreviewPage initial={previewEstimate(PREVIEW_START)} assumptions={previewAssumptionText()} />;
}
