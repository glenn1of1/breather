// The only Jev interface the app depends on (spec §8). Live and mock both implement it.
// Jev only ever sees the ALREADY-SUPPRESSED pilot-end signals (H6), never raw small numbers.
import "server-only";
import type { PilotEnd, VerdictCategory } from "@/lib/contracts";

export type JevVerdict = {
  category: VerdictCategory;
  /** Jev's probability for the chosen category. */
  confidence: number;
  /** Jev's yes-probabilities for the sub-judgments. */
  subJudgments: { valueShown: number; demandExceedsPlaces: number };
};

export interface JevClient {
  readonly name: "jev" | "mock";
  judgeVerdict(signals: PilotEnd["signals"], signal: AbortSignal): Promise<JevVerdict>;
  /** Probability (0–1) that each quote contains personal information, in input order. */
  containsPII(quotes: string[], signal: AbortSignal): Promise<number[]>;
}
