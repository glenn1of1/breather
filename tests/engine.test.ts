// Engine checks for the parts that are already implemented. Allocation tests go here with ENG-3.
import { describe, expect, it } from "vitest";
import { isEligible, isCameClose } from "@/lib/engine/eligibility";
import { priorityScore } from "@/lib/engine/priority";
import { suppressCount } from "@/lib/engine/suppress";
import { rulesVerdict } from "@/lib/engine/verdict-rules";
import { DEFAULT_EMPLOYER } from "@/config/defaults";
import type { SurveyAnswers } from "@/lib/contracts";

const base: SurveyAnswers = { q1: "yes", q2: "<5", q3: "<3m", q4: "no", q5: "no", q6: 3, q7: "yes", q8: true, q9: "0", q10: 5, q11: 4 };
const cfg = DEFAULT_EMPLOYER.config;

describe("eligibility (ENG-1)", () => {
  it("default rules: Q1 yes + Q8 is enough (R2)", () => expect(isEligible(base, cfg)).toBe(true));
  it("Q1 no is never eligible and not 'came close'", () => {
    expect(isEligible({ ...base, q1: "no" }, cfg)).toBe(false);
    expect(isCameClose({ ...base, q1: "no" }, cfg)).toBe(false);
  });
  it("Q1 yes with Q8 unticked is not eligible but counts as 'came close' (D2)", () => {
    expect(isEligible({ ...base, q8: false }, cfg)).toBe(false);
    expect(isCameClose({ ...base, q8: false }, cfg)).toBe(true);
  });
  it("optional hours rule makes <5 h 'came close'", () => {
    const strict = { ...cfg, requireHours: true };
    expect(isEligible(base, strict)).toBe(false);
    expect(isCameClose(base, strict)).toBe(true);
  });
});

describe("priority (ENG-2)", () => {
  it("max case is 8", () => expect(priorityScore({ ...base, q2: "20+", q4: "yes", q5: "yes", q6: 7, q7: "no" })).toBe(8));
  it("min case is 0", () => expect(priorityScore(base)).toBe(0));
});

describe("suppression (ENG-4)", () => {
  it.each([[0, 0], [1, { suppressed: true }], [4, { suppressed: true }], [5, 5]])("%i → %o", (n, out) => expect(suppressCount(n)).toEqual(out));
});

describe("rules verdict (AI-1)", () => {
  it("scale", () => expect(rulesVerdict({ improvedCount: 3, uptake: 0.9, waitlist: 8 })).toBe("scale"));
  it("sustain", () => expect(rulesVerdict({ improvedCount: 2, uptake: 0.75, waitlist: 2 })).toBe("sustain"));
  it("stop on low uptake", () => expect(rulesVerdict({ improvedCount: 4, uptake: 0.5, waitlist: 9 })).toBe("stop"));
});
