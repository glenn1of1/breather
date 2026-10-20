// CFO-1 / AI-1 / H9: does live Jev give each scenario's expected verdict within the 3 s budget?
//   npm run verify:jev -- [runs]     (needs TYPESAFE_API_KEY; uses the seed pipeline, no database)
// Run it before judging; only use JEV_MODE=live on stage if every run passes.
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { buildSnapshots } from "../lib/aggregate/build-snapshots";
import { generateScenario } from "../lib/seed/generate";
import { liveJev } from "../lib/jev/live";
import { JEV_TIMEOUT_MS } from "../config/defaults";
import { Scenario } from "../lib/contracts";
import { liveClaims } from "../tests/helpers/live";

async function main() {
  if (!process.env.TYPESAFE_API_KEY) {
    console.error("TYPESAFE_API_KEY is not set (.env.local)");
    process.exitCode = 1;
    return;
  }
  const runs = Number(process.argv[2] ?? 5);
  let failures = 0;
  for (const sc of Scenario.options) {
    // The stage path: seeded scenario plus one live sign-up.
    const data = generateScenario(sc);
    data.claims = [...data.claims, ...liveClaims(1)];
    const signals = buildSnapshots(data)[12]!.pilotEnd!.signals;
    const rows: string[] = [];
    for (let i = 0; i < runs; i++) {
      const t0 = Date.now();
      try {
        const v = await liveJev.judgeVerdict(signals, AbortSignal.timeout(JEV_TIMEOUT_MS));
        const ms = Date.now() - t0;
        const ok = v.category === sc && ms <= JEV_TIMEOUT_MS;
        if (!ok) failures++;
        rows.push(`${ok ? "ok " : "BAD"} ${v.category.padEnd(7)} conf ${v.confidence.toFixed(2)}  value ${v.subJudgments.valueShown.toFixed(2)}  demand ${v.subJudgments.demandExceedsPlaces.toFixed(2)}  ${ms} ms`);
      } catch (e) {
        failures++;
        rows.push(`ERR ${(e as Error).name}: ${String((e as Error).message).slice(0, 80)} (${Date.now() - t0} ms)`);
      }
    }
    console.log(`${sc} (rules say ${signals.rulesCategory})\n  ${rows.join("\n  ")}`);
  }
  console.log(`\n${failures === 0 ? "PASS: live Jev is safe for the stage" : `FAIL: ${failures} of ${runs * 3} runs wrong, slow or failed — keep JEV_MODE=mock`}`);
  process.exitCode = failures ? 1 : 0;
}
main();
