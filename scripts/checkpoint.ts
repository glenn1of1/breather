// H7: the 9 PM / pre-judging checkpoint as one command, against a RUNNING deployment.
//   npm run checkpoint -- https://breather.dev                  (production / demo DB)
//   npm run checkpoint -- http://localhost:3000                 (local)
// The demo is gated (SEC-1): set CHECKPOINT_ACCESS_CODE to one of the deployment's DEMO_ACCESS_CODES.
// It seeds, submits one live sign-up per scenario, checks verdicts, payload privacy, the
// week-12 lock and determinism, then RESETS to scale. Partial promotion fails closed:
// a stub or missing verdict route is a NO-GO, never a "still working" (H7).
import { DashboardSnapshot, isSuppressed, SurveyResult, VerdictResult } from "../lib/contracts";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const ANSWERS = { q1: "yes", q2: "5-19", q3: "3m+", q4: "no", q5: "no", q6: 5, q7: "no", q8: true, q9: "1-2", q10: 5, q11: 3 };
const results: [boolean, string][] = [];
const check = (ok: boolean, label: string) => results.push([ok, label]);
/** Week-13 SPI range and whether CPI is above 1 (under budget), per scenario (CFO-7). */
const SPI_CPI = { scale: [0.9, 1.1, false], sustain: [0.7, 0.9, true], stop: [0.35, 0.55, false] } as const;

let cookie = "";

/** Exchanges CHECKPOINT_ACCESS_CODE for the demo cookie (SEC-1). */
async function signIn() {
  const code = process.env.CHECKPOINT_ACCESS_CODE;
  if (!code) throw new Error("set CHECKPOINT_ACCESS_CODE to a demo access code");
  const res = await fetch(BASE + "/api/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  const set = res.headers.getSetCookie().find((c) => c.startsWith("breather_access="));
  if (!res.ok || !set) throw new Error(`access code rejected (${res.status})`);
  cookie = set.split(";")[0]!;
}

async function call(method: "GET" | "POST", path: string, body?: unknown) {
  const t0 = Date.now();
  const headers: Record<string, string> = { cookie };
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, ms: Date.now() - t0 };
}

/** Person counts that must never show 1–4. */
function smallCounts(s: DashboardSnapshot): string[] {
  const vals: [string, unknown][] = [...Object.entries(s.counts).filter(([k]) => k !== "places")];
  if (s.report) vals.push(["report.activeCaregivers", s.report.activeCaregivers]);
  if (s.pilotEnd) vals.push(["signals.waitlist", s.pilotEnd.signals.waitlist], ["signals.cameClose", s.pilotEnd.signals.cameClose]);
  return vals.filter(([, v]) => typeof v === "number" && v >= 1 && v <= 4).map(([k, v]) => `${k}=${v}`);
}

async function main() {
  console.log(`Checkpoint against ${BASE}\n`);
  await signIn();
  for (const sc of ["scale", "sustain", "stop"] as const) {
    const seed = await call("POST", `/api/demo/seed?scenario=${sc}`);
    check(seed.status === 200 && seed.ms < 3000, `${sc}: seed 200 in < 3 s (${seed.status}, ${seed.ms} ms)`);

    const snaps = await Promise.all(Array.from({ length: 13 }, (_, i) => call("GET", `/api/dashboard?week=${i + 1}`)));
    const parsed = snaps.map((r) => DashboardSnapshot.safeParse(r.json));
    check(parsed.every((p) => p.success && p.data.scenario === sc), `${sc}: 13 snapshots valid and from this scenario`);
    const leaks = parsed.flatMap((p) => (p.success ? smallCounts(p.data) : []));
    check(leaks.length === 0, `${sc}: no person count shows 1–4${leaks.length ? ` (${leaks.slice(0, 3).join(", ")})` : ""}`);
    const blob = JSON.stringify(snaps.map((s) => s.json));
    check(!/PH-[0-9A-Z]{4}-\d{2}/.test(blob) && !/"(contact|q12Contact|claimNo)"/.test(blob), `${sc}: no claim numbers or contact fields in dashboard data`);

    // CFO-7: earned value is hidden early and tells the scenario's story at week 13.
    const e1 = parsed[0]!.success ? parsed[0]!.data.evm : null;
    const e13 = parsed[12]!.success ? parsed[12]!.data.evm : null;
    check(!!e1 && e1.spi === null && e1.pv === 0 && isSuppressed(e1.ev), `${sc}: week-1 SPI null and EV hidden (${JSON.stringify(e1)})`);
    const [spiLo, spiHi, cpiOver] = SPI_CPI[sc];
    const spi = e13?.spi, cpi = e13?.cpi;
    check(
      !!e13 && e13.pv === e13.bac && typeof spi === "number" && spi >= spiLo && spi <= spiHi && typeof cpi === "number" && cpi > 1 === cpiOver,
      `${sc}: week-13 SPI ${JSON.stringify(spi)} in ${spiLo}–${spiHi}, CPI ${JSON.stringify(cpi)} ${cpiOver ? "> 1" : "≤ 1"}`,
    );

    const again = await call("POST", `/api/demo/seed?scenario=${sc}`);
    const snaps2 = await Promise.all(Array.from({ length: 13 }, (_, i) => call("GET", `/api/dashboard?week=${i + 1}`)));
    check(again.status === 200 && JSON.stringify(snaps2.map((s) => s.json)) === blob, `${sc}: reseeding gives identical data`);

    const w1 = parsed[0]!.success ? parsed[0]!.data.counts.potentialCaregivers : null;
    const sub = await call("POST", "/api/survey", { token: "demo", answers: ANSWERS });
    const out = SurveyResult.safeParse(sub.json);
    check(sub.status === 200 && out.success && out.data.outcome === "accepted" && sub.ms < 2000, `${sc}: live sign-up accepted in < 2 s (${sub.ms} ms)`);
    const w1after = DashboardSnapshot.safeParse((await call("GET", "/api/dashboard?week=1")).json);
    check(w1after.success && typeof w1 === "number" && w1after.data.counts.potentialCaregivers === w1 + 1, `${sc}: week-1 total ${JSON.stringify(w1)} → +1 after the sign-up`);
    check(w1after.success && !isSuppressed(w1after.data.counts.potentialCaregivers), `${sc}: week-1 total stays visible (H1)`);

    const v = await call("POST", "/api/verdict");
    const vr = VerdictResult.safeParse(v.json);
    check(v.status === 200 && vr.success && vr.data.category === sc, `${sc}: verdict = ${sc} after a live sign-up (got ${vr.success ? `${vr.data.category} via ${vr.data.source}` : v.status})`);
  }
  const locked = await call("POST", "/api/verdict?week=12");
  check(locked.status === 409, `CFO view locked before week 13 (${locked.status})`);
  const bad = await call("POST", "/api/survey", { token: "not-a-link", answers: ANSWERS });
  check(bad.status === 404, `unknown survey link rejected (${bad.status})`);
  const pages = await Promise.all(["/", "/demo", "/demo/s/demo", "/demo/employee/email", "/demo/hr", "/demo/hr/email", "/demo/hr/report", "/demo/cfo", "/demo/cfo/email", "/demo/preview"].map(async (p) => [p, (await fetch(BASE + p, { headers: { cookie } })).status] as const));
  check(pages.every(([, s]) => s === 200), `pages load: ${pages.map(([p, s]) => `${p} ${s}`).join(", ")}`);

  const reset = await call("POST", "/api/demo/seed?scenario=scale");
  check(reset.status === 200, "reset to scale");

  for (const [ok, label] of results) console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
  const failed = results.filter(([ok]) => !ok).length;
  console.log(`\n${failed === 0 ? "GO" : "NO-GO"}: ${results.length - failed}/${results.length} checks passed`);
  console.log("Also run: npm run db:prove-wall (needs the matching .env file)");
  process.exitCode = failed ? 1 : 0;
}
main().catch((e) => { console.error("checkpoint crashed:", (e as Error).message); process.exitCode = 1; });
