// PRD ENG-4, ENG-5, HR-1..4. Pure: row-level pilot data in, 13 suppressed DashboardSnapshots out.
// recompute() wraps this with the DB; CI tests it with no DB. Nothing per-person leaves this file.
import "server-only";
import { MIN_GROUP_SIZE, PILOT_WEEKS } from "@/config/defaults";
import { DashboardSnapshot, type MeasureKey } from "@/lib/contracts";
import { allocate, type Allocation, type AllocationInput } from "@/lib/engine/allocation";
import { earnedValue, FUNDS_PER_PLACE } from "@/lib/engine/evm";
import { computeOutcomeSignals, LEAVE_DAYS, toPilotEndSignals, type Participant } from "@/lib/engine/outcomes";
import { suppressCount, suppressDerived, suppressHeadline } from "@/lib/engine/suppress";
import type { CheckinRow, PilotData, UsageRow } from "./types";

const SERVICES = ["household", "companionship", "personal_care", "other"] as const;
const MEASURES: MeasureKey[] = ["work_impact", "leave_days", "intent_stay", "satisfaction"];
/** Pilot weeks in each reporting month (13 weeks ≈ 3 months). */
export const MONTH_WEEKS: Record<1 | 2 | 3, [number, number]> = { 1: [1, 4], 2: [5, 9], 3: [10, 13] };
/** Focus-group themes exist from this week on. */
const THEMES_FROM_WEEK = 6;

const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
};

const measureValue = (k: MeasureKey, c: { q6: number; q9: CheckinRow["q9"]; q10: number; q11: number }) =>
  k === "work_impact" ? c.q6 : k === "leave_days" ? LEAVE_DAYS[c.q9] : k === "intent_stay" ? c.q10 : c.q11;

/** People holding a place at the end of `week` (dropped-out people stop counting the week they leave). */
const holds = (a: Allocation | undefined) => a?.status === "accepted";
/** People who ever held a place (for outcomes): accepted or dropped out. */
const participated = (a: Allocation | undefined) => a?.status === "accepted" || a?.status === "dropped_out";

export function buildSnapshots(data: PilotData): DashboardSnapshot[] {
  const { employer, claims } = data;
  const cfg = employer.config;
  const inputs: AllocationInput[] = claims.map((c) => ({
    claimNo: c.claimNo,
    submittedAt: c.submittedAt,
    pilotWeek: c.pilotWeek,
    eligible: c.eligible,
    priority: c.priority,
    dropOutWeek: data.dropOuts.find((d) => d.claimNo === c.claimNo)?.pilotWeek ?? null,
  }));
  const allocs: Map<string, Allocation>[] = [new Map()];
  for (let w = 1; w <= PILOT_WEEKS; w++) allocs.push(allocate(inputs, cfg, w));

  // Usage counts only while the person holds a place that week (decision H3).
  const counted: UsageRow[] = data.usage.filter((u) => holds(allocs[u.pilotWeek]?.get(u.claimNo)));
  const claimByNo = new Map(claims.map((c) => [c.claimNo, c]));

  const snapshots: DashboardSnapshot[] = [];
  for (let week = 1; week <= PILOT_WEEKS; week++) {
    const alloc = allocs[week]!;
    const arrived = claims.filter((c) => c.pilotWeek <= week);
    const st = { accepted: 0, droppedOut: 0, waitlisted: 0, pending: 0 };
    for (const a of alloc.values()) {
      if (a.status === "accepted") st.accepted++;
      else if (a.status === "dropped_out") st.droppedOut++;
      else if (a.status === "waitlisted") st.waitlisted++;
      else if (a.status === "pending") st.pending++;
    }
    const cameClose = arrived.filter((c) => c.cameClose).length;
    const potential = arrived.filter((c) => c.answers.q1 === "yes").length;
    const headline = suppressHeadline({ ...st, cameClose, potentialCaregivers: potential });

    // Weekly hours, hidden when fewer than N people used care that week.
    const weekly = Array.from({ length: week }, (_, i) => {
      const rows = counted.filter((u) => u.pilotWeek === i + 1);
      return { week: i + 1, hours: suppressDerived(round1(sum(rows.map((r) => r.hours))), new Set(rows.map((r) => r.claimNo)).size) };
    });
    const toDate = counted.filter((u) => u.pilotWeek <= week);
    const totalHours = sum(toDate.map((u) => u.hours));
    // Each share is hidden unless at least N people used that service.
    const mix = SERVICES.map((service) => {
      const rows = toDate.filter((u) => u.serviceType === service);
      return {
        service,
        share: suppressDerived(totalHours > 0 ? round2(sum(rows.map((u) => u.hours)) / totalHours) : 0, new Set(rows.map((u) => u.claimNo)).size),
      };
    });

    // Trends: tracked people = held a place and have at least one check-in by this week.
    // A brand-new sign-up has no check-in, so it never moves a baseline (live-update differencing, P1).
    const checkinsToDate = data.checkins.filter((c) => c.pilotWeek <= week && participated(alloc.get(c.claimNo)));
    const tracked = [...new Set(checkinsToDate.map((c) => c.claimNo))].map((n) => claimByNo.get(n)!).filter(Boolean);
    const trends = Object.fromEntries(
      MEASURES.map((k) => [
        k,
        {
          baseline: suppressDerived(round2(mean(tracked.map((c) => measureValue(k, c.answers)))), tracked.length),
          points: Array.from({ length: week }, (_, i) => {
            const rows = checkinsToDate.filter((c) => c.pilotWeek === i + 1);
            return { week: i + 1, mean: suppressDerived(round2(mean(rows.map((r) => measureValue(k, r)))), rows.length) };
          }),
        },
      ]),
    ) as DashboardSnapshot["trends"];

    // Monthly report: the latest completed month.
    const month = ([3, 2, 1] as const).find((m) => week >= MONTH_WEEKS[m][1]);
    let report: DashboardSnapshot["report"] = null;
    if (month) {
      const [from, to] = MONTH_WEEKS[month];
      const rows = counted.filter((u) => u.pilotWeek >= from && u.pilotWeek <= to);
      const users = new Set(rows.map((r) => r.claimNo)).size;
      report = {
        month,
        hoursByService: SERVICES.map((service) => ({
          service,
          hours: suppressDerived(round1(sum(rows.filter((r) => r.serviceType === service).map((r) => r.hours))), new Set(rows.filter((r) => r.serviceType === service).map((r) => r.claimNo)).size),
        })),
        activeCaregivers: suppressCount(users),
        fundsUsed: suppressDerived(Math.round(sum(rows.map((r) => r.hours)) * employer.providerRate), users),
        fundsCap: cfg.places * FUNDS_PER_PLACE,
      };
    }

    const themes =
      week >= THEMES_FROM_WEEK
        ? data.themes.filter((t) => t.participantCount >= MIN_GROUP_SIZE).map((t) => ({ theme: t.theme, participantCount: t.participantCount, quotes: t.quotes }))
        : [];

    let pilotEnd: DashboardSnapshot["pilotEnd"] = null;
    if (week === PILOT_WEEKS) {
      const people = claims.filter((c) => participated(alloc.get(c.claimNo)));
      const participants: Participant[] = people.map((c) => {
        const last = data.checkins.filter((k) => k.claimNo === c.claimNo).sort((a, b) => b.pilotWeek - a.pilotWeek)[0];
        return {
          baseline: c.answers,
          end: last ? { q6: last.q6, q9: last.q9, q10: last.q10, q11: last.q11 } : null,
          hours: sum(counted.filter((u) => u.claimNo === c.claimNo).map((u) => u.hours)),
        };
      });
      const signals = computeOutcomeSignals({ participants, places: cfg.places, waitlist: st.waitlisted, cameClose });
      // Hours per caregiver per month, from weeks 3–13 (after ramp-up), among people who used care.
      const perMonth = people
        .map((c) => sum(counted.filter((u) => u.claimNo === c.claimNo && u.pilotWeek >= 3).map((u) => u.hours)) * (52 / 12 / 11))
        .filter((h) => h > 0);
      pilotEnd = {
        signals: toPilotEndSignals(signals),
        costInputs: {
          places: cfg.places,
          uptake: suppressDerived(round2(signals.uptake), signals.usersWithHours),
          hoursPerCaregiverPerMonth: {
            p25: suppressDerived(round1(quantile(perMonth, 0.25)), perMonth.length),
            mean: suppressDerived(round1(mean(perMonth)), perMonth.length),
            p75: suppressDerived(round1(quantile(perMonth, 0.75)), perMonth.length),
          },
        },
      };
    }

    snapshots.push(
      DashboardSnapshot.parse({
        employerName: employer.name,
        scenario: employer.scenario,
        week,
        synthetic: true,
        counts: {
          ...headline,
          placesUsed: headline.accepted,
          places: cfg.places,
          newThisWeek: suppressCount(claims.filter((c) => c.pilotWeek === week && c.answers.q1 === "yes").length),
        },
        usage: { weekly, mix },
        trends,
        themes,
        report,
        pilotEnd,
        evm: earnedValue({ places: cfg.places, budgetRate: employer.providerRate, week, usage: counted }),
      }),
    );
  }
  return snapshots;
}
