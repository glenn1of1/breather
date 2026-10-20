// Read-only connection (DASHBOARD_DATABASE_URL, role dashboard). Has no grant on the intake
// schema, so it cannot read any individual's data even by mistake (PRD PRV-1).
import "server-only";
import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

export function reader(): Sql {
  if (client) return client;
  const url = process.env.DASHBOARD_DATABASE_URL;
  if (!url) throw new Error("DASHBOARD_DATABASE_URL is not set");
  client = postgres(url, { prepare: false, max: 2, idle_timeout: 20, max_lifetime: 60 * 30, connect_timeout: 10 });
  return client;
}
