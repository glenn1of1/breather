// PRD CFO-3, spec §4.7. A projection, not a prediction: the band widens with the horizon.
// Pure and server-only (SEC-3): runs inside /api/cfo and /api/preview on every slider change.
import "server-only";
import { BAND_Z, PROJECTION_MONTHS } from "@/config/defaults";

export type BandPoint = { month: number; low: number; base: number; high: number };

const WEEKS_PER_MONTH = 52 / 12;
/** Minimum band half-width at month 1, as a share of base (decision: the band never collapses). */
export const MIN_BAND_SHARE = 0.05;
/** The trend may move the base by at most this much per month, so a short noisy series cannot explode. */
export const MAX_MONTHLY_GROWTH = 0.05;
/**
 * Fit only steady-state weeks. Earlier weeks include enrolment ramp-up (people still joining),
 * which places × uptake already counts; fitting it would project enrolment growth as cost growth.
 */
export const FIT_FROM_WEEK = 8;

/** Least-squares line through (x, y). */
function fit(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = sxx === 0 ? 0 : xs.reduce((s, x, i) => s + (x - mx) * (ys[i]! - my), 0) / sxx;
  const intercept = my - slope * mx;
  const resid = ys.map((y, i) => y - (intercept + slope * xs[i]!));
  const sd = n > 2 ? Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / (n - 2)) : 0;
  const slopeSe = sxx > 0 ? sd / Math.sqrt(sxx) : Infinity;
  return { slope, intercept, sd, meanY: my, slopeSe };
}

/**
 * @param weeklyCost observed cost per pilot week (index 0 = week 1); null for hidden or missing weeks.
 * @param month1Base base monthly cost from costToContinue(); month 1 of the band equals it.
 */
export function projectBand(weeklyCost: (number | null)[], month1Base: number): BandPoint[] {
  const pts = weeklyCost
    .map((y, i) => ({ x: i + 1, y }))
    .filter((p): p is { x: number; y: number } => p.x >= FIT_FROM_WEEK && p.y !== null);

  let growth = 0;
  let relSd = 0;
  if (pts.length >= 3) {
    const f = fit(pts.map((p) => p.x), pts.map((p) => p.y));
    const atEnd = f.intercept + f.slope * pts[pts.length - 1]!.x;
    // Only extend a trend the data clearly shows (|slope| ≥ 2 standard errors); otherwise the base
    // stays flat and the band carries the uncertainty.
    const clear = Math.abs(f.slope) >= 2 * f.slopeSe;
    if (clear && atEnd > 0) growth = (f.slope * WEEKS_PER_MONTH) / atEnd;
    if (f.meanY > 0) relSd = (f.sd * Math.sqrt(WEEKS_PER_MONTH)) / (f.meanY * WEEKS_PER_MONTH);
  }
  growth = Math.max(-MAX_MONTHLY_GROWTH, Math.min(MAX_MONTHLY_GROWTH, growth));
  const share = Math.max(BAND_Z * relSd, MIN_BAND_SHARE);

  return Array.from({ length: PROJECTION_MONTHS }, (_, i) => {
    const month = i + 1;
    const base = Math.max(0, month1Base * (1 + growth * i));
    const half = month1Base * share * Math.sqrt(month);
    return { month, low: Math.round(Math.max(0, base - half)), base: Math.round(base), high: Math.round(base + half) };
  });
}
