// PRD ENG-2, spec §4.2. Priority = H + L + M + W + A, range 0–8.
import "server-only";
import type { SurveyAnswers } from "@/lib/contracts";

export function priorityScore(a: SurveyAnswers): number {
  const H = a.q2 === "20+" ? 2 : a.q2 === "5-19" ? 1 : 0;
  const L = a.q4 === "yes" ? 1 : 0;
  const M = a.q5 === "yes" ? 1 : 0;
  const W = a.q6 >= 6 ? 2 : a.q6 >= 4 ? 1 : 0;
  const A = a.q7 === "no" ? 2 : 0;
  return H + L + M + W + A;
}
