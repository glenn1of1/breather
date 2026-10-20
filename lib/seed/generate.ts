// PRD DEMO-2, spec §7. Deterministic synthetic pilot data for one fictional employer.
// Pure: no DB, no clock. The same scenario always produces identical rows.
//
// Week-13 targets (decision H1: every headline component is 0 or >= 5; H3: three live week-1
// sign-ups must keep each verdict and still land "accepted"):
//   scale   — 12 places: 6 + 3 accepted in the window, 3 more by week 6, 8 waitlisted; 6 came close
//   sustain — 9 accepted (3 spare places, so 3 live sign-ups never create a waitlist of 1–4)
//   stop    — 9 accepted, only 5 use care (uptake 42%); 5 came close
// Each user gets 10–12 h of care over the pilot (≈ the $500 grant at $50/h) at a scenario-specific
// actual rate, so SPI ≈ 1.0 / 0.75 / 0.4 and CPI ≈ 0.96 / 1.02 / 0.91 at week 13 (CFO-7).
// "Came close" people all arrive in week 3, so week 1 (the view during the live sign-up) shows 0
// came close and the potential-caregivers total stays visible as it ticks up.
import "server-only";
import { DEFAULT_ASSUMPTIONS, DEFAULT_EMPLOYER, DEMO_EMPLOYER_ID, PILOT_WEEKS } from "@/config/defaults";
import type { Scenario } from "@/lib/contracts";
import { allocate } from "@/lib/engine/allocation";
import { isCameClose, isEligible } from "@/lib/engine/eligibility";
import { priorityScore } from "@/lib/engine/priority";
import type { CheckinRow, ClaimRow, PilotData, StoredAnswers, ThemeRow, UsageRow } from "@/lib/aggregate/types";
import themesFile from "@/data/themes.json";

export const EMPLOYER_ID = DEMO_EMPLOYER_ID;
/** Synthetic pilot start. Every seeded timestamp is long before any live submit. */
export const PILOT_START = Date.UTC(2026, 7, 3, 9, 0, 0);

type Shape = {
  /** Eligible arrivals per week (index 0 = week 1). */
  eligibleByWeek: number[];
  cameCloseByWeek: number[];
  /** Q1 = no: not potential caregivers, not counted anywhere on the dashboard. */
  notCaregivers: number;
  /** How many people who hold a place actually use care. */
  usersWithCare: number;
  /** Per-measure change at the end check-in (negative = lower). */
  delta: { q6: number; leaveBand: -2 | -1 | 0; q10: number; q11: number };
  /** Total care hours per user over the pilot (≈ what the $500 grant buys at $50/h; spec tm8 §3). */
  hoursPerUser: [number, number];
  /** Actual $/h paid per usage row, inclusive (CFO-7: drives CPI against the $50 budget rate). */
  ratePerHour: [number, number];
};

export const SHAPES: Record<Scenario, Shape> = {
  scale: {
    eligibleByWeek: [6, 3, 2, 3, 3, 3],
    cameCloseByWeek: [0, 0, 6],
    notCaregivers: 9,
    usersWithCare: 11,
    delta: { q6: -2, leaveBand: -2, q10: 2, q11: 1 }, // 3 improve: work impact, leave days, intent to stay
    hoursPerUser: [10, 12],
    ratePerHour: [48, 56], // CPI ≈ 0.96
  },
  sustain: {
    eligibleByWeek: [6, 2, 0, 0, 1],
    cameCloseByWeek: [0, 0, 5],
    notCaregivers: 8,
    usersWithCare: 9,
    delta: { q6: -2, leaveBand: -1, q10: 0, q11: 1 }, // 2 improve: work impact, leave days
    hoursPerUser: [10, 12],
    ratePerHour: [46, 52], // CPI ≈ 1.02
  },
  stop: {
    eligibleByWeek: [5, 2, 1, 1],
    cameCloseByWeek: [0, 0, 5],
    notCaregivers: 8,
    usersWithCare: 5,
    delta: { q6: -2, leaveBand: 0, q10: 0, q11: 0 }, // 1 improves: work impact
    hoursPerUser: [10, 12],
    ratePerHour: [52, 58], // CPI ≈ 0.91
  },
};

const SCENARIO_SEED: Record<Scenario, number> = { scale: 11, sustain: 23, stop: 37 };
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LEAVE_BANDS = ["0", "1-2", "3-5", "6+"] as const;
const SERVICE_WEIGHTS: [UsageRow["serviceType"], number][] = [["household", 0.47], ["companionship", 0.3], ["personal_care", 0.18], ["other", 0.05]];

/** mulberry32: small, fast, deterministic. */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]!,
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
  };
}
type Rng = ReturnType<typeof rng>;

export function claimNumber(r: Rng, taken: Set<string>): string {
  for (;;) {
    const body = Array.from({ length: 4 }, () => CROCKFORD[r.int(0, 31)]).join("");
    const no = `PH-${body}-${String(r.int(0, 99)).padStart(2, "0")}`;
    if (!taken.has(no)) {
      taken.add(no);
      return no;
    }
  }
}

const clamp7 = (x: number) => Math.max(1, Math.min(7, Math.round(x)));

function answersFor(r: Rng, kind: "eligible" | "cameClose" | "notCaregiver"): StoredAnswers {
  return {
    q1: kind === "notCaregiver" ? "no" : "yes",
    q2: r.pick(["<5", "5-19", "5-19", "20+"] as const),
    q3: r.pick(["<3m", "3m+", "3m+"] as const),
    q4: r.pick(["yes", "no"] as const),
    q5: r.pick(["yes", "no", "no"] as const),
    q6: r.int(5, 6),
    q7: r.pick(["yes", "no"] as const),
    // Came close (decision D2): helps someone but left the confirmation unticked.
    q8: kind !== "cameClose",
    q9: "3-5",
    q10: r.int(4, 5),
    q11: r.int(3, 4),
  };
}

export function generateScenario(scenario: Scenario): PilotData {
  const shape = SHAPES[scenario];
  const r = rng(SCENARIO_SEED[scenario]);
  const cfg = DEFAULT_EMPLOYER.config;
  const taken = new Set<string>();
  const claims: ClaimRow[] = [];
  let minute = 0;

  const add = (week: number, kind: "eligible" | "cameClose" | "notCaregiver") => {
    const answers = answersFor(r, kind);
    const eligible = isEligible(answers, cfg);
    claims.push({
      claimNo: claimNumber(r, taken),
      employerId: EMPLOYER_ID,
      // Spread across the week; strictly increasing so replay order is stable.
      submittedAt: new Date(PILOT_START + (week - 1) * 7 * 86_400_000 + (minute += 37) * 60_000),
      pilotWeek: week,
      answers,
      eligible,
      cameClose: isCameClose(answers, cfg),
      priority: eligible ? priorityScore(answers) : null,
      statusSnapshot: "not_eligible", // set below from the replay at the claim's own week
    });
  };
  const weeks = Math.max(shape.eligibleByWeek.length, shape.cameCloseByWeek.length);
  for (let w = 1; w <= weeks; w++) {
    for (let i = 0; i < (shape.eligibleByWeek[w - 1] ?? 0); i++) add(w, "eligible");
    for (let i = 0; i < (shape.cameCloseByWeek[w - 1] ?? 0); i++) add(w, "cameClose");
  }
  for (let i = 0; i < shape.notCaregivers; i++) add(1 + (i % 6), "notCaregiver");
  claims.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

  // What each person saw at submit time (their own week), and who holds a place at week 13.
  const inputs = claims.map((c) => ({ ...c, dropOutWeek: null }));
  for (const c of claims) {
    const s = allocate(inputs, cfg, c.pilotWeek).get(c.claimNo)!.status;
    c.statusSnapshot = s === "dropped_out" ? "accepted" : s;
  }
  const final = allocate(inputs, cfg, PILOT_WEEKS);
  const holders = claims.filter((c) => final.get(c.claimNo)?.status === "accepted");

  // Usage: the first `usersWithCare` holders (in arrival order) use care every week after they got a place.
  // Own RNG stream, so usage tuning never shifts the check-in noise below.
  const ru = rng(SCENARIO_SEED[scenario] * 7919);
  const usage: UsageRow[] = [];
  const checkins: CheckinRow[] = [];
  holders.forEach((c, idx) => {
    const from = final.get(c.claimNo)!.acceptedWeek! + 1;
    if (idx < shape.usersWithCare) {
      usage.push(...spreadHours(ru, c.claimNo, from, shape));
    }
    // Check-ins at weeks 4, 8 and 13 (once they hold a place); change grows toward the end.
    for (const w of [4, 8, 13]) {
      if (w < from) continue;
      const k = w / PILOT_WEEKS;
      const d = shape.delta;
      const band = Math.max(0, Math.min(3, LEAVE_BANDS.indexOf(c.answers.q9) + Math.round(d.leaveBand * k)));
      checkins.push({
        claimNo: c.claimNo,
        pilotWeek: w,
        q6: clamp7(c.answers.q6 + d.q6 * k + (r.next() - 0.5) * 0.6),
        q9: LEAVE_BANDS[band]!,
        q10: clamp7(c.answers.q10 + d.q10 * k + (r.next() - 0.5) * 0.6),
        q11: clamp7(c.answers.q11 + d.q11 * k + (r.next() - 0.5) * 0.6),
      });
    }
  });

  return {
    employer: { id: EMPLOYER_ID, name: DEFAULT_EMPLOYER.name, scenario, config: cfg, providerRate: DEFAULT_ASSUMPTIONS.providerRate },
    claims,
    checkins,
    usage,
    dropOuts: [],
    themes: DEMO_THEMES,
  };
}

/**
 * Splits one user's pilot total into half-hour units: every week gets at least 0.5 h (so weekly
 * hours stay visible once 5+ people use care), the rest lands on random weeks.
 */
function spreadHours(r: Rng, claimNo: string, from: number, shape: Shape): UsageRow[] {
  const weeks = PILOT_WEEKS - from + 1;
  const units = Array<number>(weeks).fill(1);
  const total = Math.max(weeks, Math.round(r.range(...shape.hoursPerUser) * 2));
  for (let i = weeks; i < total; i++) units[r.int(0, weeks - 1)]!++;
  return units.map((u, i) => ({
    claimNo,
    pilotWeek: from + i,
    hours: u / 2,
    rate: r.int(...shape.ratePerHour),
    serviceType: pickService(r),
  }));
}

function pickService(r: Rng): UsageRow["serviceType"] {
  let x = r.next();
  for (const [s, w] of SERVICE_WEIGHTS) {
    if ((x -= w) < 0) return s;
  }
  return "other";
}

/** Coded offline by scripts/code-themes.ts (quotes already screened for personal information). */
export const DEMO_THEMES: ThemeRow[] = (themesFile as { themes: ThemeRow[] }).themes;
