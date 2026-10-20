// Row shapes shared by the seed generator, buildSnapshots() and the DB layer.
// They mirror db/migrations/0000_schemas_roles.sql (intake.*) in camelCase.
import "server-only";
import type { EmployerConfig } from "@/config/defaults";
import type { Scenario, SurveyAnswers } from "@/lib/contracts";

/** Answers as stored: never includes the Q12 contact (that lives in intake.claims.contact only). */
export type StoredAnswers = Omit<SurveyAnswers, "q12Contact">;

export type ClaimRow = {
  claimNo: string;
  employerId: string;
  submittedAt: Date;
  pilotWeek: number;
  answers: StoredAnswers;
  eligible: boolean;
  cameClose: boolean;
  priority: number | null;
  statusSnapshot: "accepted" | "waitlisted" | "pending" | "not_eligible";
};

export type CheckinRow = { claimNo: string; pilotWeek: number; q6: number; q9: StoredAnswers["q9"]; q10: number; q11: number };
/** `rate` is the actual $/h paid for this row (CFO-7 actual cost); the budget rate is employer.providerRate. */
export type UsageRow = { claimNo: string; pilotWeek: number; hours: number; rate: number; serviceType: "household" | "companionship" | "personal_care" | "other" };
export type DropOutRow = { claimNo: string; pilotWeek: number };
export type ThemeRow = { theme: string; participantCount: number; quotes: { quoteHash: string; text: string }[] };

export type EmployerInfo = {
  id: string;
  name: string;
  scenario: Scenario;
  config: EmployerConfig;
  providerRate: number;
};

export type PilotData = {
  employer: EmployerInfo;
  claims: ClaimRow[];
  checkins: CheckinRow[];
  usage: UsageRow[];
  dropOuts: DropOutRow[];
  themes: ThemeRow[];
};
