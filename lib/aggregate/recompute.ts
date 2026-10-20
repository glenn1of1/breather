// PRD ENG-5. Runs on the writer connection inside the caller's transaction: takes the employer
// lock, reads row-level intake data, builds all 13 suppressed snapshots and upserts them.
// The dashboard role only ever reads the result.
import "server-only";
import type { TransactionSql } from "postgres";
import { buildSnapshots } from "./build-snapshots";
import { loadPilotData } from "./load";
import type { PilotData } from "./types";

/** Serialises every writer (survey submits, seeds) for one employer. Transaction-scoped, so it
 * works through the Supabase transaction pooler. */
export async function lockEmployer(tx: TransactionSql, employerId: string) {
  // One round trip: set the timeout and take the lock together.
  await tx`select set_config('lock_timeout', '5s', true), pg_advisory_xact_lock(hashtext('breather'), hashtext(${employerId}))`;
}

/**
 * @param data pass the pilot data if the caller already loaded it inside this transaction
 *   (after its own writes), to save a full set of round trips.
 */
export async function recompute(tx: TransactionSql, employerId: string, data?: PilotData): Promise<void> {
  const snaps = buildSnapshots(data ?? (await loadPilotData(tx, employerId)));
  const rows = snaps.map((s) => ({ employer_id: employerId, week: s.week, payload: s, computed_at: new Date() }));
  await tx`
    insert into employer.weekly_snapshot (employer_id, week, payload, computed_at)
    select x.employer_id, x.week, x.payload, x.computed_at
    from jsonb_to_recordset(${tx.json(rows as never)}) as x(employer_id text, week int, payload jsonb, computed_at timestamptz)
    on conflict (employer_id, week) do update set payload = excluded.payload, computed_at = excluded.computed_at`;
}
