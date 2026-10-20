// HR-6. The weekly HR email's content, built only from two already-suppressed snapshots.
// Pure: the page renders it; nothing is ever sent.
import { MEASURE_LABELS } from "@/config/copy";
import { isSuppressed, type DashboardSnapshot, type MeasureKey, type SuppressibleNumber } from "@/lib/contracts";

export type WeeklyEmail = {
  week: number;
  subject: string;
  lines: { label: string; value: string }[];
  trends: { label: string; change: string }[];
  dashboardPath: string;
};

const show = (v: SuppressibleNumber) => (isSuppressed(v) ? "fewer than 5" : String(v));

/** Change in a trend's latest mean since last week, as words. Hidden values never become numbers. */
function trendChange(now: DashboardSnapshot, prev: DashboardSnapshot | null, k: MeasureKey): string {
  const last = (s: DashboardSnapshot | null) => s?.trends[k].points.filter((p) => !isSuppressed(p.mean)).at(-1)?.mean as number | undefined;
  const a = last(prev), b = last(now);
  if (b === undefined) return "not enough responses yet";
  if (a === undefined || a === b) return `${b.toFixed(1)} (no change)`;
  return `${b.toFixed(1)} (${b > a ? "up" : "down"} ${Math.abs(b - a).toFixed(1)} since last week)`;
}

export function weeklyEmail(now: DashboardSnapshot, prev: DashboardSnapshot | null): WeeklyEmail {
  const c = now.counts;
  return {
    week: now.week,
    subject: `Breather weekly update: week ${now.week} of 13`,
    lines: [
      { label: "New sign-ups this week", value: isSuppressed(c.newThisWeek) ? "fewer than 5 this week" : String(c.newThisWeek) },
      { label: "Potential caregivers so far", value: show(c.potentialCaregivers) },
      { label: "Places used", value: `${show(c.placesUsed)} of ${c.places}` },
      { label: "Waitlist", value: show(c.waitlisted) },
    ],
    trends: (Object.keys(MEASURE_LABELS) as MeasureKey[]).map((k) => ({ label: MEASURE_LABELS[k], change: trendChange(now, prev, k) })),
    dashboardPath: `/demo/hr?week=${now.week}`,
  };
}
