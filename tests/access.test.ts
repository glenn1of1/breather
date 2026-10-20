// SEC-1, SEC-2: access codes, the signed cookie, safe redirects, rate limits and the Jev budget.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accessConfigured, checkCode, issueCookie, readAccess, safeNext } from "@/lib/security/access";
import { hit } from "@/lib/security/rate-limit";
import { dailyCap, takeJevCall } from "@/lib/jev/budget";

const SECRET = "x".repeat(40);

describe("access codes and cookie", () => {
  beforeEach(() => {
    process.env.DEMO_COOKIE_SECRET = SECRET;
    process.env.DEMO_ACCESS_CODES = "alpha-123, beta-456";
  });
  afterEach(() => {
    delete process.env.DEMO_COOKIE_SECRET;
    delete process.env.DEMO_ACCESS_CODES;
  });

  it("accepts each configured code (trimmed) and rejects anything else", () => {
    expect(checkCode("alpha-123")).toBeTruthy();
    expect(checkCode(" beta-456 ")).toBeTruthy();
    expect(checkCode("alpha-12")).toBeNull();
    expect(checkCode("")).toBeNull();
  });

  it("a cookie grants access until it expires", () => {
    const now = Date.UTC(2026, 9, 20);
    const cookie = issueCookie(checkCode("alpha-123")!, now);
    expect(readAccess(cookie, now + 1000)).toMatchObject({ codeId: checkCode("alpha-123") });
    expect(readAccess(cookie, now + 7 * 86_400_000 + 1000)).toBeNull();
  });

  it("rejects a tampered or foreign cookie", () => {
    const cookie = issueCookie(checkCode("alpha-123")!);
    const [payload, sig] = cookie.split(".");
    const forged = Buffer.from(JSON.stringify({ c: "x", s: "y", e: 9e9 })).toString("base64url");
    expect(readAccess(`${forged}.${sig}`)).toBeNull();
    expect(readAccess(`${payload}.${sig!.slice(0, -2)}AA`)).toBeNull();
    expect(readAccess(`${payload}`)).toBeNull();
    process.env.DEMO_COOKIE_SECRET = "y".repeat(40);
    expect(readAccess(cookie)).toBeNull();
  });

  it("removing a code revokes the cookies it issued, not the others", () => {
    const a = issueCookie(checkCode("alpha-123")!);
    const b = issueCookie(checkCode("beta-456")!);
    process.env.DEMO_ACCESS_CODES = "beta-456";
    expect(readAccess(a)).toBeNull();
    expect(readAccess(b)).not.toBeNull();
  });

  it("fails closed without a long enough secret or any code", () => {
    process.env.DEMO_COOKIE_SECRET = "short";
    expect(accessConfigured()).toBe(false);
    expect(checkCode("alpha-123")).toBeNull();
    process.env.DEMO_COOKIE_SECRET = SECRET;
    process.env.DEMO_ACCESS_CODES = " , ";
    expect(accessConfigured()).toBe(false);
  });
});

describe("safeNext", () => {
  it("keeps demo paths and refuses everything else", () => {
    expect(safeNext("/demo/cfo?x=1")).toBe("/demo/cfo?x=1");
    expect(safeNext("/demo")).toBe("/demo");
    for (const bad of [null, "", "/", "/api/verdict", "//evil.example", "https://evil.example/demo", "/demo\\..\\x", "/demox"]) expect(safeNext(bad)).toBe("/demo");
  });
});

describe("rate limit", () => {
  it("allows `max` requests per window, then reports when to retry", () => {
    const limit = { name: "t", max: 3, windowMs: 60_000 };
    const t = 1_000_000;
    expect([1, 2, 3].map(() => hit(limit, "ip1", t).ok)).toEqual([true, true, true]);
    expect(hit(limit, "ip1", t + 1000)).toEqual({ ok: false, retryAfterS: 59 });
    expect(hit(limit, "ip2", t + 1000).ok).toBe(true);
    expect(hit(limit, "ip1", t + 60_000).ok).toBe(true);
  });
});

describe("Jev daily cap", () => {
  afterEach(() => delete process.env.JEV_DAILY_CALL_CAP);

  it("defaults to 500, ignores nonsense, allows 0", () => {
    expect(dailyCap()).toBe(500);
    process.env.JEV_DAILY_CALL_CAP = "abc";
    expect(dailyCap()).toBe(500);
    process.env.JEV_DAILY_CALL_CAP = "0";
    expect(dailyCap()).toBe(0);
  });

  it("stops at the cap and resets the next UTC day", () => {
    process.env.JEV_DAILY_CALL_CAP = "2";
    const d1 = new Date("2026-10-20T10:00:00Z");
    expect([takeJevCall(d1), takeJevCall(d1), takeJevCall(d1)]).toEqual([true, true, false]);
    expect(takeJevCall(new Date("2026-10-21T00:00:01Z"))).toBe(true);
  });
});

describe("Jev over the daily cap", () => {
  afterEach(() => {
    delete process.env.JEV_MODE;
    delete process.env.JEV_DAILY_CALL_CAP;
  });

  it("counts as unavailable: the verdict falls back to the rules engine without a network call", async () => {
    process.env.JEV_MODE = "live";
    process.env.JEV_DAILY_CALL_CAP = "0";
    const { getJev } = await import("@/lib/jev");
    const { decideVerdict } = await import("@/lib/verdict/decide");
    const { buildSnapshots } = await import("@/lib/aggregate/build-snapshots");
    const { generateScenario } = await import("@/lib/seed/generate");
    const signals = buildSnapshots(generateScenario("sustain"))[12]!.pilotEnd!.signals;
    const v = await decideVerdict(signals, getJev);
    expect(v).toMatchObject({ source: "rules", category: "sustain", confidence: null });
    await expect((await getJev()).containsPII(["hello"], AbortSignal.timeout(1000))).rejects.toThrow("cap");
  });
});
