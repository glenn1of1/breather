// SEC-1. Demo access codes and the signed access cookie, shared by proxy.ts and /api/access.
// Codes come from DEMO_ACCESS_CODES (comma-separated, one per recipient). The cookie carries only a
// fingerprint of the code, so removing a code from the list revokes every cookie it issued.
// Missing or weak configuration fails closed: nobody gets in.
import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "breather_access";
export const ACCESS_MAX_AGE_S = 7 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;

export type Access = { codeId: string; sessionId: string };

function secret(): string | null {
  const s = process.env.DEMO_COOKIE_SECRET ?? "";
  return s.length >= MIN_SECRET_LENGTH ? s : null;
}

const codes = () =>
  (process.env.DEMO_ACCESS_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

const hmac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();
const fingerprint = (key: string, code: string) => hmac(key, `code:${code}`).subarray(0, 12).toString("base64url");

/** True when the gate can admit anyone (a long enough secret and at least one code). */
export const accessConfigured = () => secret() !== null && codes().length > 0;

/**
 * Constant-time check of a submitted code against every configured code. Both sides are HMACed
 * first, so timingSafeEqual always compares equal-length digests, and every code is checked.
 * Returns the matching code's fingerprint, or null.
 */
export function checkCode(input: string): string | null {
  const key = secret();
  if (!key) return null;
  const given = hmac(key, `cmp:${input.trim()}`);
  let match: string | null = null;
  for (const code of codes()) {
    const same = timingSafeEqual(given, hmac(key, `cmp:${code}`));
    if (same && match === null) match = fingerprint(key, code);
  }
  return match;
}

/** `payload.signature`, where payload = base64url JSON { c: code fingerprint, s: session id, e: expiry (s) }. */
export function issueCookie(codeId: string, now = Date.now()): string {
  const key = secret();
  if (!key) throw new Error("DEMO_COOKIE_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify({ c: codeId, s: randomBytes(9).toString("base64url"), e: Math.floor(now / 1000) + ACCESS_MAX_AGE_S })).toString("base64url");
  return `${payload}.${hmac(key, `cookie:${payload}`).toString("base64url")}`;
}

/** The access a cookie grants: valid signature, not expired, and its code still in the list. */
export function readAccess(value: string | undefined, now = Date.now()): Access | null {
  const key = secret();
  if (!key || !value) return null;
  const [payload, sig, extra] = value.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const expected = hmac(key, `cookie:${payload}`);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  let claims: { c?: unknown; s?: unknown; e?: unknown };
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims.c !== "string" || typeof claims.s !== "string" || typeof claims.e !== "number") return null;
  if (claims.e * 1000 <= now) return null;
  if (!codes().some((code) => fingerprint(key, code) === claims.c)) return null; // revoked
  return { codeId: claims.c, sessionId: claims.s };
}

/** Only same-site demo paths are allowed as the post-login destination (no open redirect). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/demo") || next.startsWith("//") || next.includes("\\")) return "/demo";
  return /^\/demo(\/|\?|$)/.test(next) ? next : "/demo";
}
