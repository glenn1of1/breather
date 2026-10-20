// PRD CFO-7, .plans/tm8-changes-spec.md §2. Earned value for care delivery: is the pilot
// delivering the care it planned (SPI), and at what cost per planned dollar (CPI)?
// Pure. Usage rows must already be "counted" (only while the person holds a place, H3).
import "server-only";
import { PILOT_WEEKS } from "@/config/defaults";
import type { Evm } from "@/lib/contracts";
import { suppressDerived } from "./suppress";

/** Respite grant per funded place (the budget behind BAC). */
export const FUNDS_PER_PLACE = 500;
/** The plan: places fill during the 2-week window, then care runs evenly from week 3 to week 13. */
export const PLAN_FROM_WEEK = 3;
const PLAN_WEEKS = PILOT_WEEKS - PLAN_FROM_WEEK + 1;

export type EvmUsage = { claimNo: string; pilotWeek: number; hours: number; rate: number };

const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * BAC = places × $500. PV(t) = BAC × (weeks of plan elapsed by t) / 11, so PV(13) = BAC.
 * EV = hours delivered × budget rate. AC = Σ hours × actual rate. SPI = EV/PV, CPI = EV/AC.
 * EV, AC, SPI and CPI come from people's usage: hidden while fewer than 5 people used care to date.
 * PV and BAC are plan values, so they are always shown.
 */
export function earnedValue(a: { places: number; budgetRate: number; week: number; usage: EvmUsage[] }): Evm {
  const bac = a.places * FUNDS_PER_PLACE;
  const elapsed = Math.max(0, Math.min(a.week, PILOT_WEEKS) - PLAN_FROM_WEEK + 1);
  const pv = Math.round((bac * elapsed) / PLAN_WEEKS);
  const toDate = a.usage.filter((u) => u.pilotWeek <= a.week);
  const users = new Set(toDate.map((u) => u.claimNo)).size;
  const ev = toDate.reduce((s, u) => s + u.hours, 0) * a.budgetRate;
  const ac = toDate.reduce((s, u) => s + u.hours * u.rate, 0);
  return {
    bac,
    pv,
    ev: suppressDerived(Math.round(ev), users),
    ac: suppressDerived(Math.round(ac), users),
    spi: pv > 0 ? suppressDerived(round2(ev / pv), users) : null,
    cpi: ac > 0 ? suppressDerived(round2(ev / ac), users) : null,
  };
}
