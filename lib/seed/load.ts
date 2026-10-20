// PRD DEMO-2. Replaces the demo employer's data with a scenario in ONE transaction, then recomputes.
// DELETE (not TRUNCATE) so dashboard polls keep reading the old snapshots until the atomic commit.
import "server-only";
import type { Sql } from "postgres";
import { DEFAULT_EMPLOYER } from "@/config/defaults";
import type { Scenario } from "@/lib/contracts";
import { lockEmployer, recompute } from "@/lib/aggregate/recompute";
import { generateScenario } from "./generate";

export async function seedScenario(sql: Sql, scenario: Scenario): Promise<{ claims: number }> {
  const d = generateScenario(scenario);
  const id = d.employer.id;
  await sql.begin(async (tx) => {
    await lockEmployer(tx, id);
    const config = { ...d.employer.config, scenario };
    await tx`
      insert into employer.employers (id, slug, survey_token, name, headcount, config)
      values (${id}, ${DEFAULT_EMPLOYER.slug}, ${DEFAULT_EMPLOYER.surveyToken}, ${d.employer.name}, ${DEFAULT_EMPLOYER.headcount}, ${tx.json(config)})
      on conflict (id) do update set name = excluded.name, headcount = excluded.headcount, config = excluded.config`;
    // FK cascade clears check-ins, usage and drop-outs.
    await tx`delete from intake.claims where employer_id = ${id}`;
    await tx`delete from employer.themes where employer_id = ${id}`;

    const claims = d.claims.map((c) => ({
      claim_no: c.claimNo, employer_id: c.employerId, submitted_at: c.submittedAt, pilot_week: c.pilotWeek,
      answers: c.answers, eligible: c.eligible, came_close: c.cameClose, priority: c.priority, status_snapshot: c.statusSnapshot,
    }));
    await tx`
      insert into intake.claims (claim_no, employer_id, submitted_at, pilot_week, answers, eligible, came_close, priority, status_snapshot)
      select * from jsonb_to_recordset(${tx.json(claims as never)}) as x(claim_no text, employer_id text, submitted_at timestamptz,
        pilot_week int, answers jsonb, eligible boolean, came_close boolean, priority int, status_snapshot text)`;
    if (d.checkins.length)
      await tx`
        insert into intake.checkins (claim_no, pilot_week, q6, q9, q10, q11)
        select * from jsonb_to_recordset(${tx.json(d.checkins.map((k) => ({ claim_no: k.claimNo, pilot_week: k.pilotWeek, q6: k.q6, q9: k.q9, q10: k.q10, q11: k.q11 })) as never)})
          as x(claim_no text, pilot_week int, q6 int, q9 text, q10 int, q11 int)`;
    if (d.usage.length)
      await tx`
        insert into intake.usage_events (claim_no, pilot_week, hours, rate, service_type)
        select * from jsonb_to_recordset(${tx.json(d.usage.map((u) => ({ claim_no: u.claimNo, pilot_week: u.pilotWeek, hours: u.hours, rate: u.rate, service_type: u.serviceType })) as never)})
          as x(claim_no text, pilot_week int, hours numeric, rate numeric, service_type text)`;
    if (d.dropOuts.length)
      await tx`
        insert into intake.drop_outs (claim_no, pilot_week)
        select * from jsonb_to_recordset(${tx.json(d.dropOuts.map((o) => ({ claim_no: o.claimNo, pilot_week: o.pilotWeek })) as never)})
          as x(claim_no text, pilot_week int)`;
    if (d.themes.length)
      await tx`
        insert into employer.themes (employer_id, theme, participant_count, quotes)
        select ${id}, x.theme, x.participant_count, x.quotes
        from jsonb_to_recordset(${tx.json(d.themes.map((t) => ({ theme: t.theme, participant_count: t.participantCount, quotes: t.quotes })) as never)})
          as x(theme text, participant_count int, quotes jsonb)`;
    await recompute(tx, id);
  });
  return { claims: d.claims.length };
}
