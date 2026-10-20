// Spec §4.4: outcome measures at pilot end vs. baseline, uptake and demand.
// Raw values here (writer side only); toPilotEndSignals() produces the suppressed, shareable form.
import "server-only";
import { DEFAULT_ASSUMPTIONS, MIN_GROUP_SIZE, OUTCOME_THRESHOLDS } from "@/config/defaults";
import type { MeasureKey, PilotEnd, SurveyAnswers } from "@/lib/contracts";
import { suppressCount, suppressDerived } from "./suppress";
import { rulesVerdict } from "./verdict-rules";

/** Q9 leave-day bands → days (midpoints; "6+" counted as 7). */
export const LEAVE_DAYS: Record<SurveyAnswers["q9"], number> = { "0": 0, "1-2": 1.5, "3-5": 4, "6+": 7 };

export type MeasureAnswers = Pick<SurveyAnswers, "q6" | "q9" | "q10" | "q11">;

export type Participant = {
  /** Answers at sign-up. */
  baseline: MeasureAnswers;
  /** Latest check-in answers, or null if none. */
  end: MeasureAnswers | null;
  /** Total care hours used while holding a place. */
  hours: number;
};

export type OutcomeSignals = {
  measures: Record<MeasureKey, { baseline: number; end: number; contributors: number; improved: boolean }>;
  improvedCount: number;
  uptake: number;
  usersWithHours: number;
  waitlist: number;
  cameClose: number;
};

const value = (k: MeasureKey, a: MeasureAnswers) =>
  k === "work_impact" ? a.q6 : k === "leave_days" ? LEAVE_DAYS[a.q9] : k === "intent_stay" ? a.q10 : a.q11;

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

function improved(k: MeasureKey, baseline: number, end: number): boolean {
  const t = OUTCOME_THRESHOLDS[k];
  switch (t.kind) {
    case "drop_points": return baseline - end >= t.value;
    case "drop_pct": return baseline > 0 && (baseline - end) / baseline >= t.value;
    case "rise_points": return end - baseline >= t.value;
    case "end_at_least": return end >= t.value;
  }
}

/**
 * @param participants people who held a place (accepted or later dropped out) — decision H3.
 */
export function computeOutcomeSignals(input: {
  participants: Participant[];
  places: number;
  waitlist: number;
  cameClose: number;
}): OutcomeSignals {
  const paired = input.participants.filter((p) => p.end !== null);
  const keys: MeasureKey[] = ["work_impact", "leave_days", "intent_stay", "satisfaction"];
  const measures = Object.fromEntries(
    keys.map((k) => {
      const b = round2(mean(paired.map((p) => value(k, p.baseline))));
      const e = round2(mean(paired.map((p) => value(k, p.end!))));
      // No improvement is claimed from a group smaller than N.
      const ok = paired.length >= MIN_GROUP_SIZE && improved(k, b, e);
      return [k, { baseline: b, end: e, contributors: paired.length, improved: ok }];
    }),
  ) as OutcomeSignals["measures"];
  const usersWithHours = input.participants.filter((p) => p.hours >= 1).length;
  return {
    measures,
    improvedCount: keys.filter((k) => measures[k].improved).length,
    uptake: input.places > 0 ? Math.min(1, usersWithHours / input.places) : 0,
    usersWithHours,
    waitlist: input.waitlist,
    cameClose: input.cameClose,
  };
}

/** The suppressed form stored in the snapshot (H6). Threshold results are decided from raw values. */
export function toPilotEndSignals(s: OutcomeSignals): PilotEnd["signals"] {
  const rulesCategory = rulesVerdict(s);
  return {
    measures: Object.fromEntries(
      Object.entries(s.measures).map(([k, m]) => [
        k,
        { baseline: suppressDerived(m.baseline, m.contributors), end: suppressDerived(m.end, m.contributors), improved: m.improved },
      ]),
    ) as PilotEnd["signals"]["measures"],
    improvedCount: s.improvedCount,
    uptake: suppressDerived(round2(s.uptake), s.usersWithHours),
    waitlist: suppressCount(s.waitlist),
    cameClose: suppressCount(s.cameClose),
    valueShown: s.improvedCount >= DEFAULT_ASSUMPTIONS.minImprovedMeasures && s.uptake >= DEFAULT_ASSUMPTIONS.minUptake,
    demandExceedsPlaces: s.waitlist >= MIN_GROUP_SIZE,
    rulesCategory,
  };
}
