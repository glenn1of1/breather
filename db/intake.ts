// Writer connection (DATABASE_URL, role postgres). Can read row-level intake data.
// NEVER import this from app/hr, app/cfo, app/api/dashboard or components (enforced by ESLint).
import "server-only";
import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

/** Created on first use, so a missing env var never breaks a build or an unrelated page. */
export function writer(): Sql {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = postgres(url, {
    prepare: false, // required by the Supabase pooler in transaction mode
    max: 3,
    idle_timeout: 20, // drop idle sockets before the pooler does (H8: first request after a pitch)
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });
  return client;
}
