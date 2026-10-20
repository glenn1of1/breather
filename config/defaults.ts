// Demo employer defaults and engine constants. See .plans/breather-spec.md §4.
// Every value marked ASSUMPTION is shown on screen as an editable assumption (PRD AI-5).
// Server-only (SEC-3): client code imports PILOT_WEEKS and MIN_GROUP_SIZE from config/public.
import "server-only";
import { MIN_GROUP_SIZE, PILOT_WEEKS } from "./public";

export { MIN_GROUP_SIZE, PILOT_WEEKS };
export const PROJECTION_MONTHS = 12;
/** z-score for the 80% projection band (spec §4.7). */
export const BAND_Z = 1.28;
/** Jev calls longer than this fall back to the rules engine (PRD AI-1). */
export const JEV_TIMEOUT_MS = 3000;

export type EmployerConfig = {
  places: number;
  enrolmentWindowWeeks: number;
  /** R2: extra eligibility rules are off by default. */
  requireHours: boolean;
  minHoursBand: "5-19" | "20+";
  requireDuration: boolean;
};

/** The one demo employer's id in employer.employers (multiple employers are out of scope). */
export const DEMO_EMPLOYER_ID = "northwind";

export const DEFAULT_EMPLOYER = {
  name: "Northwind Logistics (fictional)",
  slug: "northwind",
  surveyToken: "demo",
  headcount: 100,
  config: {
    places: 12,
    enrolmentWindowWeeks: 2,
    requireHours: false,
    minHoursBand: "5-19",
    requireDuration: false,
  } satisfies EmployerConfig,
};

export const DEFAULT_ASSUMPTIONS = {
  /** ASSUMPTION: $500 bought about 10 hours in Phase 1. */
  providerRate: 50,
  /** ASSUMPTION: illustrative SE Health admin fee. */
  adminFeePct: 0.15,
  /** Rules fallback: value shown needs at least this uptake. */
  minUptake: 0.6,
  /** Rules fallback: value shown needs at least this many improved measures. */
  minImprovedMeasures: 2,
} as const;

/** Cut-offs for "improved" per outcome measure (spec §4.4). */
export const OUTCOME_THRESHOLDS = {
  work_impact: { kind: "drop_points", value: 1.0 },
  leave_days: { kind: "drop_pct", value: 0.25 },
  intent_stay: { kind: "rise_points", value: 1.0 },
  satisfaction: { kind: "end_at_least", value: 5.0 },
} as const;

/** Before-you-join defaults (PRE-2). ASSUMPTIONS, labelled on screen; editable there. */
export const PREVIEW_ASSUMPTIONS = {
  providerRate: DEFAULT_ASSUMPTIONS.providerRate,
  adminFeePct: DEFAULT_ASSUMPTIONS.adminFeePct,
  /** ASSUMPTION: about 4 hours of respite per caregiver per month (the $500 grant ≈ 10 h over the 13-week pilot). */
  hoursPerCaregiverPerMonth: 4,
  /** ASSUMPTION: three in four funded places get used. */
  uptake: 0.75,
} as const;
