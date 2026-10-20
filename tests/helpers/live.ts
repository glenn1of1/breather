// A live demo sign-up, as /api/survey will store it: week 1, submitted "now" (after all seed rows).
import type { ClaimRow } from "@/lib/aggregate/types";

export const liveClaims = (n: number, base = Date.UTC(2026, 9, 18, 12)): ClaimRow[] =>
  Array.from({ length: n }, (_, i) => ({
    claimNo: `PH-L1VE-${String(i).padStart(2, "0")}`,
    employerId: "northwind",
    submittedAt: new Date(base + i * 60_000),
    pilotWeek: 1,
    answers: { q1: "yes", q2: "5-19", q3: "3m+", q4: "no", q5: "no", q6: 5, q7: "no", q8: true, q9: "1-2", q10: 5, q11: 3 },
    eligible: true,
    cameClose: false,
    priority: 3,
    statusSnapshot: "accepted",
  }));
