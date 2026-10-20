// SEC-2. Daily cap on live Jev calls (JEV_DAILY_CALL_CAP, default 500), so a leaked access code
// can't run up costs. Kept in memory per server instance and reset at midnight UTC. Over the cap,
// Jev counts as unavailable: the verdict falls back to the rules engine and the PII check fails closed.
import "server-only";

export const DEFAULT_DAILY_CALL_CAP = 500;

let day = "";
let used = 0;

export function dailyCap(): number {
  const raw = process.env.JEV_DAILY_CALL_CAP;
  const cap = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isInteger(cap) && cap >= 0 ? cap : DEFAULT_DAILY_CALL_CAP;
}

/** Reserves one live Jev call for today. False once the day's cap is used up. */
export function takeJevCall(now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    used = 0;
  }
  if (used >= dailyCap()) return false;
  used++;
  return true;
}

export class JevCapReached extends Error {
  constructor() {
    super("jev daily call cap reached");
  }
}
