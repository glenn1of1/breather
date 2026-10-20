// Rules fallback for the verdict (PRD AI-1, spec §4.5). Always computed, even when Jev answers,
// so the CFO view can show whether the rules agree.
import "server-only";
import { DEFAULT_ASSUMPTIONS, MIN_GROUP_SIZE } from "@/config/defaults";
import type { OutcomeSignals } from "./outcomes";

export type Category = "scale" | "sustain" | "stop";

export function rulesVerdict(s: Pick<OutcomeSignals, "improvedCount" | "uptake" | "waitlist">): Category {
  const valueShown = s.improvedCount >= DEFAULT_ASSUMPTIONS.minImprovedMeasures && s.uptake >= DEFAULT_ASSUMPTIONS.minUptake;
  if (!valueShown) return "stop";
  return s.waitlist >= MIN_GROUP_SIZE ? "scale" : "sustain";
}
