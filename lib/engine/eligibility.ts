// PRD ENG-1, spec §4.1. Pure function: no AI, no I/O.
import "server-only";
import type { SurveyAnswers } from "@/lib/contracts";
import type { EmployerConfig } from "@/config/defaults";

const HOURS_ORDER = ["<5", "5-19", "20+"] as const;

export function isEligible(a: SurveyAnswers, cfg: EmployerConfig): boolean {
  if (a.q1 !== "yes" || a.q8 !== true) return false;
  if (cfg.requireHours && HOURS_ORDER.indexOf(a.q2) < HOURS_ORDER.indexOf(cfg.minHoursBand)) return false;
  if (cfg.requireDuration && a.q3 !== "3m+") return false;
  return true;
}

/** Said they help someone (Q1 = yes) but did not qualify. Counted anonymously (PRD SUR-5). */
export function isCameClose(a: SurveyAnswers, cfg: EmployerConfig): boolean {
  return a.q1 === "yes" && !isEligible(a, cfg);
}
