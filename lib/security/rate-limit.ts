// SEC-2. Fixed-window rate limits kept in memory. No new service: on Vercel each instance keeps its
// own counters and a cold start resets them, so these are soft limits that stop scripted abuse,
// not exact global quotas. The daily Jev cap (lib/jev/budget.ts) bounds the cost either way.
import "server-only";

export type Limit = { name: string; max: number; windowMs: number };

/** Every route that can call Jev (verdict, PII check). */
export const JEV_PER_SESSION: Limit = { name: "jev-session", max: 10, windowMs: 60_000 };
export const JEV_PER_IP: Limit = { name: "jev-ip", max: 30, windowMs: 60_000 };
/** Re-seeding rewrites the demo database. */
export const SEED_PER_IP: Limit = { name: "seed-ip", max: 10, windowMs: 60_000 };
/** Everything else in the gated API (polling dashboards, CFO and preview sliders). */
export const API_PER_IP: Limit = { name: "api-ip", max: 240, windowMs: 60_000 };
/** Access-code attempts, so codes can't be guessed. */
export const ACCESS_PER_IP: Limit = { name: "access-ip", max: 10, windowMs: 15 * 60_000 };

const MAX_KEYS = 20_000;
const windows = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
  // Still too many live keys (a flood of new IPs): drop the oldest rather than grow without bound.
  for (const k of windows.keys()) {
    if (windows.size <= MAX_KEYS) break;
    windows.delete(k);
  }
}

/** Counts one request against `limit` for `id`. `retryAfterS` is set when the request is over. */
export function hit(limit: Limit, id: string, now = Date.now()): { ok: true } | { ok: false; retryAfterS: number } {
  if (windows.size > MAX_KEYS) sweep(now);
  const key = `${limit.name}:${id}`;
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { ok: true };
  }
  w.count++;
  return w.count <= limit.max ? { ok: true } : { ok: false, retryAfterS: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) };
}

/** The client's IP. Vercel sets x-real-ip and x-forwarded-for itself, so a client can't spoof them. */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function tooMany(retryAfterS: number) {
  return Response.json({ error: "too many requests, please try again shortly" }, { status: 429, headers: { "Retry-After": String(retryAfterS) } });
}
