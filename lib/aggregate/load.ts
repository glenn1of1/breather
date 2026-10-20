// Reads one employer's row-level pilot data (writer side only) into the shape buildSnapshots() takes.
import "server-only";
import type { Sql, TransactionSql } from "postgres";
import { DEFAULT_ASSUMPTIONS, type EmployerConfig } from "@/config/defaults";
import { Scenario } from "@/lib/contracts";
import type { CheckinRow, ClaimRow, DropOutRow, PilotData, ThemeRow, UsageRow } from "./types";

type Db = Sql | TransactionSql;

export type EmployerRecord = { id: string; name: string; config: EmployerConfig & { scenario?: string } };

export async function loadEmployerByToken(db: Db, token: string): Promise<EmployerRecord | null> {
  const [row] = await db<EmployerRecord[]>`select id, name, config from employer.employers where survey_token = ${token}`;
  return row ?? null;
}

export async function loadPilotData(db: Db, employerId: string): Promise<PilotData> {
  // Issued together so postgres.js pipelines them on one connection: ~1 round trip instead of 6.
  const [[emp], claims, checkins, usage, dropOuts, themes] = await Promise.all([
    db<EmployerRecord[]>`select id, name, config from employer.employers where id = ${employerId}`,
    db`
      select claim_no, employer_id, submitted_at, pilot_week, answers, eligible, came_close, priority, status_snapshot
      from intake.claims where employer_id = ${employerId}`,
    db`
      select k.claim_no, k.pilot_week, k.q6, k.q9, k.q10, k.q11
      from intake.checkins k join intake.claims c using (claim_no) where c.employer_id = ${employerId}`,
    db`
      select u.claim_no, u.pilot_week, u.hours, u.rate, u.service_type
      from intake.usage_events u join intake.claims c using (claim_no) where c.employer_id = ${employerId}`,
    db`
      select d.claim_no, d.pilot_week
      from intake.drop_outs d join intake.claims c using (claim_no) where c.employer_id = ${employerId}`,
    db`select theme, participant_count, quotes from employer.themes where employer_id = ${employerId}`,
  ]);
  if (!emp) throw new Error(`unknown employer ${employerId}`);

  return {
    employer: {
      id: emp.id,
      name: emp.name,
      scenario: Scenario.catch("scale").parse(emp.config.scenario),
      config: emp.config,
      providerRate: DEFAULT_ASSUMPTIONS.providerRate,
    },
    claims: claims.map(
      (r): ClaimRow => ({
        claimNo: r.claim_no,
        employerId: r.employer_id,
        submittedAt: r.submitted_at,
        pilotWeek: r.pilot_week,
        answers: r.answers,
        eligible: r.eligible,
        cameClose: r.came_close,
        priority: r.priority,
        statusSnapshot: r.status_snapshot,
      }),
    ),
    checkins: checkins.map((r): CheckinRow => ({ claimNo: r.claim_no, pilotWeek: r.pilot_week, q6: r.q6, q9: r.q9, q10: r.q10, q11: r.q11 })),
    // numeric comes back as a string from postgres.js
    usage: usage.map((r): UsageRow => ({ claimNo: r.claim_no, pilotWeek: r.pilot_week, hours: Number(r.hours), rate: Number(r.rate), serviceType: r.service_type })),
    dropOuts: dropOuts.map((r): DropOutRow => ({ claimNo: r.claim_no, pilotWeek: r.pilot_week })),
    themes: themes.map((r): ThemeRow => ({ theme: r.theme, participantCount: r.participant_count, quotes: r.quotes })),
  };
}
