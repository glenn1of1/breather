// PRD ENG-3, spec §4.3 with decision D3 ("accepted stays accepted"). Pure and deterministic.
//
// Replay, week by week, in (pilotWeek, submittedAt, claimNo) order:
//   1. Drop-outs this week free their place. After the window, the top of the waitlist takes it.
//   2. New sign-ups. Not eligible → not_eligible.
//      In the window: accepted while a place is free and nobody is pending; otherwise pending.
//      After the window: accepted only if a place is free and nobody is waiting; otherwise waitlisted.
//   3. At the end of the last window week, pending people fill the free places by priority
//      (ties: earlier sign-up); the rest join the waitlist in priority order.
// Nobody who was shown "accepted" is ever moved off a place.
import "server-only";
import type { EmployerConfig } from "@/config/defaults";

export type AllocationInput = {
  claimNo: string;
  submittedAt: Date;
  pilotWeek: number;
  eligible: boolean;
  priority: number | null;
  /** Week the person stops using their place (synthetic drop-outs). Ignored unless they hold a place. */
  dropOutWeek: number | null;
};

export type AllocationStatus = "accepted" | "waitlisted" | "pending" | "not_eligible" | "dropped_out";

export type Allocation = {
  status: AllocationStatus;
  /** Week the person got a place, if they ever did. */
  acceptedWeek: number | null;
};

const byArrival = (a: AllocationInput, b: AllocationInput) =>
  a.pilotWeek - b.pilotWeek ||
  a.submittedAt.getTime() - b.submittedAt.getTime() ||
  (a.claimNo < b.claimNo ? -1 : a.claimNo > b.claimNo ? 1 : 0);

/** Highest priority first; ties go to the earlier arrival. */
const byPriority = (a: AllocationInput, b: AllocationInput) => (b.priority ?? 0) - (a.priority ?? 0) || byArrival(a, b);

/** Status of every claim with pilotWeek <= asOfWeek, as of the end of `asOfWeek`. */
export function allocate(
  claims: AllocationInput[],
  cfg: Pick<EmployerConfig, "places" | "enrolmentWindowWeeks">,
  asOfWeek: number,
): Map<string, Allocation> {
  const result = new Map<string, Allocation>();
  const arrived = claims.filter((c) => c.pilotWeek <= asOfWeek).sort(byArrival);
  const holders = new Set<string>();
  let pending: AllocationInput[] = [];
  const waitlist: AllocationInput[] = [];

  const accept = (c: AllocationInput, week: number) => {
    holders.add(c.claimNo);
    result.set(c.claimNo, { status: "accepted", acceptedWeek: week });
  };
  const joinWaitlist = (c: AllocationInput) => {
    waitlist.push(c);
    waitlist.sort(byPriority);
    result.set(c.claimNo, { status: "waitlisted", acceptedWeek: null });
  };
  const free = () => cfg.places - holders.size;

  for (let week = 1; week <= asOfWeek; week++) {
    const inWindow = week <= cfg.enrolmentWindowWeeks;

    // 1. Drop-outs among current holders.
    for (const c of arrived) {
      if (c.dropOutWeek === week && holders.has(c.claimNo)) {
        holders.delete(c.claimNo);
        result.set(c.claimNo, { status: "dropped_out", acceptedWeek: result.get(c.claimNo)!.acceptedWeek });
      }
    }
    if (!inWindow) {
      while (free() > 0 && waitlist.length > 0) accept(waitlist.shift()!, week);
    }

    // 2. New sign-ups this week.
    for (const c of arrived.filter((x) => x.pilotWeek === week)) {
      if (!c.eligible) {
        result.set(c.claimNo, { status: "not_eligible", acceptedWeek: null });
      } else if (inWindow) {
        if (pending.length === 0 && free() > 0) accept(c, week);
        else {
          pending.push(c);
          result.set(c.claimNo, { status: "pending", acceptedWeek: null });
        }
      } else if (waitlist.length === 0 && free() > 0) {
        accept(c, week);
      } else {
        joinWaitlist(c);
      }
    }

    // 3. Window close: remaining places go to pending people by priority.
    if (week === cfg.enrolmentWindowWeeks) {
      const ranked = [...pending].sort(byPriority);
      pending = [];
      for (const c of ranked) {
        if (free() > 0) accept(c, week);
        else joinWaitlist(c);
      }
    }
  }
  return result;
}

/** Counts by status, for the headline tiles. */
export function countStatuses(alloc: Map<string, Allocation>): Record<AllocationStatus, number> {
  const out: Record<AllocationStatus, number> = { accepted: 0, waitlisted: 0, pending: 0, not_eligible: 0, dropped_out: 0 };
  for (const a of alloc.values()) out[a.status]++;
  return out;
}
