// CFO-1, AI-1, AI-3, AI-4: verdict decision, fallback and reasons.
import { describe, expect, it } from "vitest";
import { decideVerdict } from "@/lib/verdict/decide";
import { verdictReasons } from "@/lib/engine/verdict-reasons";
import { mockJev } from "@/lib/jev/mock";
import type { JevClient } from "@/lib/jev/client";
import { VerdictResult, type PilotEnd } from "@/lib/contracts";

const H = { suppressed: true } as const;
const m = { baseline: 5, end: 3, improved: true };
const signals = (o: Partial<PilotEnd["signals"]> = {}): PilotEnd["signals"] => ({
  measures: { work_impact: m, leave_days: m, intent_stay: m, satisfaction: { ...m, improved: false } },
  improvedCount: 3, uptake: 0.92, waitlist: 8, cameClose: 6,
  valueShown: true, demandExceedsPlaces: true, rulesCategory: "scale", ...o,
});
const fakeJev = (category: "scale" | "sustain" | "stop", delayMs = 0): JevClient => ({
  name: "jev",
  judgeVerdict: (_s, signal) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => resolve({ category, confidence: 0.81, subJudgments: { valueShown: 0.9, demandExceedsPlaces: 0.8 } }), delayMs);
      signal.addEventListener("abort", () => { clearTimeout(t); reject(new Error("aborted")); });
    }),
  containsPII: async (q) => q.map(() => 0),
});

describe("decideVerdict", () => {
  it("uses Jev's category and confidence when it answers in time and agrees", async () => {
    const v = await decideVerdict(signals(), async () => fakeJev("scale"));
    expect(v).toMatchObject({ category: "scale", source: "jev", confidence: 0.81, rulesAgree: true });
    expect(() => VerdictResult.parse(v)).not.toThrow();
  });

  it("shows a disagreement openly", async () => {
    const v = await decideVerdict(signals(), async () => fakeJev("sustain"));
    expect(v).toMatchObject({ category: "sustain", source: "jev", rulesCategory: "scale", rulesAgree: false });
    expect(v.reasons.at(-1)).toMatch(/rules engine would recommend scale/);
  });

  it("falls back to rules when Jev is too slow, and aborts the call", async () => {
    const t0 = Date.now();
    const v = await decideVerdict(signals(), async () => fakeJev("stop", 5_000), 50);
    expect(Date.now() - t0).toBeLessThan(1_000);
    expect(v).toMatchObject({ category: "scale", source: "rules", confidence: null, rulesAgree: true });
  });

  it("falls back to rules when the Jev client cannot even be created (no API key)", async () => {
    const v = await decideVerdict(signals(), async () => { throw new Error("TypeSafeError: No API key"); });
    expect(v).toMatchObject({ source: "rules", category: "scale" });
  });

  it("JEV_MODE=mock makes no Jev call and reports the rules engine (AI-4)", async () => {
    const v = await decideVerdict(signals({ rulesCategory: "sustain" }), async () => mockJev);
    expect(v).toMatchObject({ source: "rules", category: "sustain", confidence: null });
  });
});

describe("verdictReasons (AI-3, H6)", () => {
  it("gives 3-5 reasons ending with the recommendation", () => {
    const r = verdictReasons(signals(), "scale");
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.length).toBeLessThanOrEqual(5);
    expect(r.at(-1)).toMatch(/^Recommendation: scale/);
  });
  it("never prints a hidden value", () => {
    const r = verdictReasons(signals({ uptake: H, waitlist: H, rulesCategory: "stop", valueShown: false }), "stop");
    expect(r.join(" ")).toMatch(/Fewer than 5 people used care/);
    expect(r.join(" ")).toMatch(/Fewer than 5 people are waiting/);
    expect(r.join(" ")).not.toMatch(/\b[1-4] (eligible )?people\b/);
  });
});
