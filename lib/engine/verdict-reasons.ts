// PRD CFO-1, AI-3. Jev returns no text, so the reasons are factual sentences built here from the
// already-suppressed signals (H6). They state facts, so they never contradict the category shown;
// when Jev and the rules disagree, an extra sentence says so.
import "server-only";
import { DEFAULT_ASSUMPTIONS } from "@/config/defaults";
import { isSuppressed, type PilotEnd, type VerdictCategory } from "@/lib/contracts";

type Signals = PilotEnd["signals"];
const pct = (x: number) => `${Math.round(x * 100)}%`;
const bar = pct(DEFAULT_ASSUMPTIONS.minUptake);

const CONCLUSION: Record<VerdictCategory, string> = {
  scale: "Recommendation: scale. The pilot shows value and more eligible people want it than there are funded places.",
  sustain: "Recommendation: sustain. The pilot shows value and the current funded places meet demand.",
  stop: "Recommendation: stop. The pilot did not show enough value to continue as designed.",
};

export function verdictReasons(s: Signals, category: VerdictCategory): string[] {
  const reasons = [`${s.improvedCount} of 4 outcome measures improved against the baseline.`];
  reasons.push(
    isSuppressed(s.uptake)
      ? `Fewer than 5 people used care, so uptake is under the ${bar} bar.`
      : `${pct(s.uptake)} of funded places were used, ${s.uptake >= DEFAULT_ASSUMPTIONS.minUptake ? "above" : "under"} the ${bar} bar.`,
  );
  reasons.push(
    isSuppressed(s.waitlist)
      ? "Fewer than 5 people are waiting for a place, so current places meet demand."
      : s.waitlist === 0
        ? "No one is waiting for a place, so current places meet demand."
        : `${s.waitlist} eligible people are waiting for a place, so demand exceeds the funded places.`,
  );
  reasons.push(CONCLUSION[category]);
  if (category !== s.rulesCategory) {
    reasons.push(`The rules engine would recommend ${s.rulesCategory}. Review the inputs before deciding.`);
  }
  return reasons;
}

export function verdictInputs(s: Signals): { label: string; value: string }[] {
  const show = (v: Signals["uptake"], fmt: (n: number) => string) => (isSuppressed(v) ? "<5 people" : fmt(v));
  return [
    { label: "Measures improved", value: `${s.improvedCount} of 4` },
    { label: "Uptake (share of funded places used)", value: show(s.uptake, pct) },
    { label: "Waitlist", value: show(s.waitlist, String) },
    { label: "Came close (helped someone, didn't qualify)", value: show(s.cameClose, String) },
  ];
}
