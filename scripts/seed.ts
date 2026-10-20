// CLI: npm run seed -- [scale|sustain|stop]   (default: scale)
// Uses DATABASE_URL from .env.local. Same code path as POST /api/demo/seed.
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { Scenario } from "../lib/contracts";
import { writer } from "../db/intake";
import { seedScenario } from "../lib/seed/load";

async function main() {
  const scenario = Scenario.parse(process.argv[2] ?? "scale");
  const t0 = Date.now();
  const { claims } = await seedScenario(writer(), scenario);
  console.log(`seeded ${scenario}: ${claims} claims in ${Date.now() - t0} ms`);
}
main().then(() => writer().end()).catch(async (e) => { console.error(e); await writer().end(); process.exit(1); });
