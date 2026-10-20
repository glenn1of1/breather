// Deterministic stand-in for JEV_MODE=mock (the default). Never makes a network call (AI-4).
import "server-only";
import type { JevClient } from "./client";

const PII_PATTERN = /(@|\d{3}[-. ]?\d{3}[-. ]?\d{4}|\bmy (manager|boss|supervisor)\b|\b[A-Z][a-z]+ (from|in) [A-Z]?[a-z]+)/;

export const mockJev: JevClient = {
  name: "mock",
  async judgeVerdict(signals) {
    return {
      category: signals.rulesCategory,
      confidence: 1,
      subJudgments: { valueShown: signals.valueShown ? 1 : 0, demandExceedsPlaces: signals.demandExceedsPlaces ? 1 : 0 },
    };
  },
  async containsPII(quotes) {
    return quotes.map((q) => (PII_PATTERN.test(q) ? 1 : 0));
  },
};
