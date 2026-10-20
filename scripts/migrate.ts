// Applies db/migrations/*.sql in order as postgres (DATABASE_URL).
// Optional: DASHBOARD_DB_PASSWORD sets (or rotates) the dashboard role's password.
// Run: npm run db:migrate
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const admin = process.env.DATABASE_URL;
if (!admin) throw new Error("DATABASE_URL is not set");
const sql = postgres(admin, { prepare: false, max: 1 });

async function main() {
  const dir = join(__dirname, "..", "db", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    console.log(`applying ${file}`);
    await sql.unsafe(readFileSync(join(dir, file), "utf8"));
  }
  const pw = process.env.DASHBOARD_DB_PASSWORD;
  if (pw) {
    await sql.unsafe(`alter role dashboard with password '${pw.replace(/'/g, "''")}'`);
    console.log("password set for dashboard");
  }
}
main().then(() => sql.end()).catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
