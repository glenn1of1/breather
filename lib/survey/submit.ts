// PRD SUR-3..6, ENG-1..3. One transaction: lock → insert → allocate → recompute → commit.
import "server-only";
import type { Sql } from "postgres";
import type { SurveyAnswers, SurveyResult } from "@/lib/contracts";
import { allocate } from "@/lib/engine/allocation";
import { isCameClose, isEligible } from "@/lib/engine/eligibility";
import { priorityScore } from "@/lib/engine/priority";
import { lockEmployer, recompute } from "@/lib/aggregate/recompute";
import { loadEmployerByToken, loadPilotData } from "@/lib/aggregate/load";
import { newClaimNumber } from "./claim-no";

/** Decision D4: every live sign-up is stamped pilot week 1. */
export const LIVE_PILOT_WEEK = 1;

export class UnknownTokenError extends Error {}

export async function submitSurvey(sql: Sql, token: string, input: SurveyAnswers): Promise<SurveyResult> {
  const employer = await loadEmployerByToken(sql, token);
  if (!employer) throw new UnknownTokenError();
  const cfg = employer.config;

  // Q12 contact is stored only in intake.claims.contact, never inside answers (H5).
  const { q12Contact, ...answers } = input;
  const contact = q12Contact?.trim() || null; // normalised here too, whatever the caller did
  const eligible = isEligible(input, cfg);

  return sql.begin(async (tx) => {
    await lockEmployer(tx, employer.id);
    let claimNo: string | undefined;
    for (let attempt = 0; attempt < 5 && !claimNo; attempt++) {
      const candidate = newClaimNumber();
      const rows = await tx`
        insert into intake.claims (claim_no, employer_id, submitted_at, pilot_week, answers, eligible, came_close, priority, status_snapshot, contact)
        values (${candidate}, ${employer.id}, now(), ${LIVE_PILOT_WEEK}, ${tx.json(answers)}, ${eligible},
                ${isCameClose(input, cfg)}, ${eligible ? priorityScore(input) : null}, 'not_eligible', ${contact})
        on conflict (claim_no) do nothing
        returning claim_no`;
      if (rows.length) claimNo = candidate;
    }
    if (!claimNo) throw new Error("could not allocate a unique claim number");

    // What this person sees: their status at their own pilot week.
    const data = await loadPilotData(tx, employer.id);
    const inputs = data.claims.map((c) => ({ ...c, dropOutWeek: data.dropOuts.find((d) => d.claimNo === c.claimNo)?.pilotWeek ?? null }));
    const status = allocate(inputs, cfg, LIVE_PILOT_WEEK).get(claimNo)?.status ?? "not_eligible";
    const outcome = status === "dropped_out" ? "accepted" : status;
    await tx`update intake.claims set status_snapshot = ${outcome} where claim_no = ${claimNo}`;
    // Snapshots do not use status_snapshot, so the data loaded above is still current.
    await recompute(tx, employer.id, data);

    if (outcome === "not_eligible") return { outcome };
    const result: SurveyResult = { outcome, claimNo };
    if (outcome === "pending") {
      const close = new Date(Date.now() + (cfg.enrolmentWindowWeeks - LIVE_PILOT_WEEK + 1) * 7 * 86_400_000);
      result.decidedOn = close.toISOString().slice(0, 10);
    }
    return result;
  });
}
