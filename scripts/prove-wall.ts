// Privacy proof for the README and the deck: dashboard must NOT be able to read intake.
// Run: npm run db:prove-wall
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import postgres from "postgres";

const url = process.env.DASHBOARD_DATABASE_URL;
if (!url) throw new Error("DASHBOARD_DATABASE_URL is not set");
const sql = postgres(url, { prepare: false, max: 1 });

async function main() {
  const ok = await sql`select count(*)::int as n from employer.weekly_snapshot`;
  console.log(`dashboard reads employer.weekly_snapshot: OK (${ok[0]!.n} rows)`);
  try {
    await sql`select * from intake.claims limit 1`;
    console.error("FAIL: dashboard could read intake.claims. The privacy wall is broken.");
    process.exitCode = 1;
  } catch (e) {
    console.log(`dashboard reads intake.claims: BLOCKED (${(e as Error).message})`);
  }
}
main().finally(() => sql.end());
