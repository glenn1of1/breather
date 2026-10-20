// API contracts shared by frontend and backend. Every API response is parsed with
// these schemas, and every file in fixtures/ is checked against them in tests.
// Change a contract only through a PR that Glenn and Vicka both see.
import { z } from "zod";

// ---------- shared ----------

/** A value hidden because fewer than MIN_GROUP_SIZE people are behind it (PRD ENG-4). */
export const Suppressed = z.object({ suppressed: z.literal(true) });
export const suppressible = <T extends z.ZodTypeAny>(inner: T) => z.union([inner, Suppressed]);
export const SuppressibleNumber = suppressible(z.number());
export type SuppressibleNumber = z.infer<typeof SuppressibleNumber>;
export const isSuppressed = (v: unknown): v is z.infer<typeof Suppressed> =>
  typeof v === "object" && v !== null && "suppressed" in v;

export const Scenario = z.enum(["scale", "sustain", "stop"]);
export type Scenario = z.infer<typeof Scenario>;

export const Week = z.number().int().min(1).max(13);

export const MeasureKey = z.enum(["work_impact", "leave_days", "intent_stay", "satisfaction"]);
export type MeasureKey = z.infer<typeof MeasureKey>;

export const ServiceType = z.enum(["household", "companionship", "personal_care", "other"]);

// ---------- survey (PRD SUR-*) ----------

const YesNo = z.enum(["yes", "no"]);
const Scale7 = z.number().int().min(1).max(7);

export const SurveyAnswers = z.object({
  q1: YesNo,
  q2: z.enum(["<5", "5-19", "20+"]),
  q3: z.enum(["<3m", "3m+"]),
  q4: YesNo,
  q5: YesNo,
  q6: Scale7,
  q7: YesNo,
  /** Optional (decision D2): Q1 = yes with Q8 unticked is not eligible and counts as "came close". */
  q8: z.boolean(),
  q9: z.enum(["0", "1-2", "3-5", "6+"]),
  q10: Scale7,
  q11: Scale7,
  /** Stored only in the intake schema. Never returned by any API. Blank input becomes undefined. */
  q12Contact: z
    .string()
    .max(200)
    .transform((v) => (v.trim() ? v.trim() : undefined))
    .optional(),
});
export type SurveyAnswers = z.infer<typeof SurveyAnswers>;

export const SurveyRequest = z.object({ token: z.string(), answers: SurveyAnswers });
export type SurveyRequest = z.infer<typeof SurveyRequest>;

export const Outcome = z.enum(["accepted", "waitlisted", "pending", "not_eligible"]);
export type Outcome = z.infer<typeof Outcome>;

export const SurveyResult = z.object({
  outcome: Outcome,
  /** Present for accepted, waitlisted and pending (decision: pending gets one). Format PH-XXXX-NN. */
  claimNo: z.string().regex(/^PH-[0-9A-HJKMNP-TV-Z]{4}-\d{2}$/).optional(),
  /** ISO date; present only for pending. */
  decidedOn: z.string().optional(),
});
export type SurveyResult = z.infer<typeof SurveyResult>;

// ---------- dashboard (PRD HR-*) ----------

export const TrendPoint = z.object({ week: Week, mean: SuppressibleNumber });

export const Theme = z.object({
  theme: z.string(),
  participantCount: SuppressibleNumber,
  /** Only quotes that passed the personal-info check. */
  quotes: z.array(z.object({ quoteHash: z.string(), text: z.string() })),
});

export const MonthlyReport = z.object({
  month: z.number().int().min(1).max(3),
  hoursByService: z.array(z.object({ service: ServiceType, hours: SuppressibleNumber })),
  activeCaregivers: SuppressibleNumber,
  fundsUsed: SuppressibleNumber,
  fundsCap: z.number(),
});

export const VerdictCategory = z.enum(["scale", "sustain", "stop"]);
export type VerdictCategory = z.infer<typeof VerdictCategory>;

/**
 * End-of-pilot inputs for the CFO view (decision D1), present only at week 13.
 * Every value is ALREADY suppressed (H6): the verdict route and Jev only ever see these.
 * Weekly cost is not stored: the client derives it from `usage.weekly` hours × rate × (1 + fee).
 */
export const PilotEnd = z.object({
  signals: z.object({
    measures: z.record(
      MeasureKey,
      z.object({
        baseline: SuppressibleNumber,
        end: SuppressibleNumber,
        /** False when fewer than N people contributed: no improvement is claimed from a small group. */
        improved: z.boolean(),
      }),
    ),
    improvedCount: z.number().int().min(0).max(4),
    uptake: SuppressibleNumber,
    waitlist: SuppressibleNumber,
    cameClose: SuppressibleNumber,
    /** Decided on the writer side from raw values; exposes only the threshold result. */
    valueShown: z.boolean(),
    demandExceedsPlaces: z.boolean(),
    rulesCategory: VerdictCategory,
  }),
  /** Observed defaults for the CFO sliders. A suppressed value falls back to a labelled assumption. */
  costInputs: z.object({
    places: z.number().int().positive(),
    uptake: SuppressibleNumber,
    hoursPerCaregiverPerMonth: z.object({ p25: SuppressibleNumber, mean: SuppressibleNumber, p75: SuppressibleNumber }),
  }),
});
export type PilotEnd = z.infer<typeof PilotEnd>;

/**
 * Earned value for care delivery (PRD CFO-7, contract v1.2). Present on every week.
 * BAC and PV are plan values (always shown); EV, AC, SPI and CPI are hidden under 5 users.
 * SPI is null before week 3 (nothing planned yet); CPI is null while nothing has been spent.
 */
export const Evm = z.object({
  /** Budget at completion: places × $500. */
  bac: z.number(),
  /** Planned value to date: BAC spread evenly over weeks 3–13. */
  pv: z.number(),
  /** Earned value: hours delivered × budget rate. */
  ev: SuppressibleNumber,
  /** Actual cost: hours × the rate actually paid. */
  ac: SuppressibleNumber,
  /** Schedule performance: EV / PV (1 = on plan, < 1 = behind). */
  spi: SuppressibleNumber.nullable(),
  /** Cost performance: EV / AC (1 = on budget, < 1 = paying more per hour than budgeted). */
  cpi: SuppressibleNumber.nullable(),
});
export type Evm = z.infer<typeof Evm>;

export const DashboardSnapshot = z.object({
  employerName: z.string(),
  scenario: Scenario,
  week: Week,
  synthetic: z.literal(true),
  counts: z.object({
    potentialCaregivers: SuppressibleNumber,
    /** Components of potentialCaregivers (secondary suppression, H1): accepted + droppedOut + waitlisted + pending + cameClose. */
    accepted: SuppressibleNumber,
    droppedOut: SuppressibleNumber,
    waitlisted: SuppressibleNumber,
    pending: SuppressibleNumber,
    cameClose: SuppressibleNumber,
    placesUsed: SuppressibleNumber,
    places: z.number(),
    newThisWeek: SuppressibleNumber,
  }),
  usage: z.object({
    weekly: z.array(z.object({ week: Week, hours: SuppressibleNumber })),
    mix: z.array(z.object({ service: ServiceType, share: suppressible(z.number().min(0).max(1)) })),
  }),
  trends: z.record(MeasureKey, z.object({ baseline: SuppressibleNumber, points: z.array(TrendPoint) })),
  themes: z.array(Theme),
  report: MonthlyReport.nullable(),
  pilotEnd: PilotEnd.nullable(),
  evm: Evm,
});
export type DashboardSnapshot = z.infer<typeof DashboardSnapshot>;

// ---------- verdict (PRD CFO-1, AI-1, AI-3) ----------

export const VerdictResult = z.object({
  category: VerdictCategory,
  /** Jev's probability for the category; null when the rules engine answered (shown as "n/a"). */
  confidence: z.number().min(0).max(1).nullable(),
  reasons: z.array(z.string()).min(3).max(5),
  inputs: z.array(z.object({ label: z.string(), value: z.string() })),
  source: z.enum(["jev", "rules"]),
  rulesCategory: VerdictCategory,
  rulesAgree: z.boolean(),
});
export type VerdictResult = z.infer<typeof VerdictResult>;

// ---------- cost and projection (PRD CFO-2..4, PRE-*) ----------

export const CostAssumptions = z.object({
  providerRate: z.number().positive(),
  hoursPerCaregiverPerMonth: z.number().nonnegative(),
  /** Low/high hours for the range (observed P25/P75). Default: 0.75× and 1.25× the base. */
  hoursLow: z.number().nonnegative().optional(),
  hoursHigh: z.number().nonnegative().optional(),
  places: z.number().int().positive(),
  uptake: z.number().min(0).max(1),
  adminFeePct: z.number().min(0).max(1),
});
export type CostAssumptions = z.infer<typeof CostAssumptions>;

const Range = z.object({ low: z.number(), base: z.number(), high: z.number() });

export const CostResult = z.object({
  monthly: Range,
  annual: Range,
  /** 12 months, the band widens with the horizon. */
  band: z.array(z.object({ month: z.number().int().min(1).max(12), low: z.number(), base: z.number(), high: z.number() })),
  bandLevel: z.literal(0.8),
});
export type CostResult = z.infer<typeof CostResult>;

// ---------- CFO view (PRD CFO-1..7, SEC-3) ----------

/** Slider values in the design's units: $/h, h/month, places, % and %. */
export const CfoAssumptions = z.object({
  rate: z.number().positive().max(1000),
  hours: z.number().nonnegative().max(200),
  places: z.number().int().positive().max(10_000),
  uptake: z.number().min(0).max(100),
  admin: z.number().min(0).max(100),
});
export type CfoAssumptions = z.infer<typeof CfoAssumptions>;

/** Edited slider values per scenario; the server uses the entry for the scenario it holds. */
export const CfoRequest = z.object({ edits: z.partialRecord(Scenario, CfoAssumptions) });
export type CfoEdits = z.infer<typeof CfoRequest>["edits"];

export const CfoGraph = z.object({
  id: z.string(),
  title: z.string(),
  unit: z.string(),
  baseline: z.number().nullable(),
  points: z.array(z.object({ month: z.number().int(), value: z.number().nullable() })),
});
export type CfoGraph = z.infer<typeof CfoGraph>;

export const DecisionInput = z.object({
  label: z.string(),
  unit: z.string(),
  before: SuppressibleNumber.nullable(),
  after: SuppressibleNumber,
  target: z.string(),
  met: z.boolean().nullable(),
  percent: z.boolean().optional(),
});
export type DecisionInput = z.infer<typeof DecisionInput>;

/** Everything the CFO page shows, computed on the server (SEC-3). Months = weeks 4, 9 and 13. */
export const CfoView = z.object({
  months: z.tuple([DashboardSnapshot, DashboardSnapshot, DashboardSnapshot]),
  defaults: CfoAssumptions,
  /** The values `cost` and `graphs` were computed from (an edit, or the defaults). */
  assumptions: CfoAssumptions,
  cost: CostResult,
  graphs: z.array(CfoGraph),
  inputs: z.array(DecisionInput),
  /** The plain-language explanation for each possible recommendation. */
  explanation: z.record(VerdictCategory, z.string()),
  timeline: z.array(z.object({ month: z.number().int(), spi: z.number().nullable(), cpi: z.number().nullable() })),
});
export type CfoView = z.infer<typeof CfoView>;

// ---------- before you join (PRD PRE-1, PRE-2) ----------

/** The final UI's sliders: headcount, caregiver share in percent (30–35) and pilot places. */
export const PreviewRequest = z.object({
  headcount: z.number().int().min(1).max(100_000),
  sharePct: z.number().min(30).max(35),
  places: z.number().int().min(1).max(10_000),
});
export type PreviewRequest = z.infer<typeof PreviewRequest>;

export const PreviewResult = z.object({
  potentialCaregivers: z.object({ low: z.number(), high: z.number() }),
  pilotCost: z.literal(0),
  costToContinue: CostResult,
  highDemand: CostResult,
});
export type PreviewResult = z.infer<typeof PreviewResult>;

// ---------- misc ----------

export const PiiRequest = z.object({ quotes: z.array(z.object({ quoteHash: z.string(), text: z.string() })) });
export const PiiResult = z.object({
  results: z.array(z.object({ quoteHash: z.string(), containsPii: z.boolean(), source: z.enum(["jev", "mock", "fail_closed"]) })),
});

export const SeedResult = z.object({ scenario: Scenario, claims: z.number(), ms: z.number() });

export const ReportReceipt = z.object({ receiptId: z.string(), submittedAt: z.string() });
