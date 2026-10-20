// Contract v1.1 behaviour that the API and engine rely on.
import { describe, expect, it } from "vitest";
import { SurveyAnswers, VerdictResult } from "@/lib/contracts";

const answers = { q1: "yes", q2: "5-19", q3: "3m+", q4: "no", q5: "no", q6: 5, q7: "no", q8: true, q9: "1-2", q10: 5, q11: 3 };

describe("SurveyAnswers", () => {
  it("accepts an unticked Q8 (decision D2: came close)", () => {
    expect(SurveyAnswers.parse({ ...answers, q8: false }).q8).toBe(false);
  });
  it.each(["", "   "])("turns a blank Q12 contact (%j) into undefined (H5)", (v) => {
    expect(SurveyAnswers.parse({ ...answers, q12Contact: v }).q12Contact).toBeUndefined();
  });
  it("trims a filled Q12 contact", () => {
    expect(SurveyAnswers.parse({ ...answers, q12Contact: "  555-0100 " }).q12Contact).toBe("555-0100");
  });
  it("rejects an out-of-range scale answer", () => {
    expect(() => SurveyAnswers.parse({ ...answers, q6: 8 })).toThrow();
  });
});

describe("VerdictResult", () => {
  const v = { category: "stop", confidence: null, source: "rules", rulesCategory: "stop", rulesAgree: true, inputs: [] };
  it("requires 3-5 reasons (CFO-1)", () => {
    expect(() => VerdictResult.parse({ ...v, reasons: ["a", "b"] })).toThrow();
    expect(VerdictResult.parse({ ...v, reasons: ["a", "b", "c"] }).confidence).toBeNull();
  });
});
