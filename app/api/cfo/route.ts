// PRD CFO-1..7, SEC-3. The CFO view's numbers, computed on the server from the month-end snapshots
// (weeks 4, 9 and 13) through the read-only dashboard role. The browser sends slider values and gets
// results back; the cost model and the decision rules never reach it.
import type { NextRequest } from "next/server";
import { reader } from "@/db/employer";
import { DEMO_EMPLOYER_ID, PILOT_WEEKS } from "@/config/defaults";
import { CfoRequest, CfoView, DashboardSnapshot } from "@/lib/contracts";
import { cfoView, MONTH_END_WEEKS, type MonthSnapshots } from "@/lib/cfo/model";

export async function POST(req: NextRequest) {
  const week = Number(req.nextUrl.searchParams.get("week") ?? PILOT_WEEKS);
  // CFO-6: enforced on the server, not only hidden in the UI.
  if (week < PILOT_WEEKS) return Response.json({ error: "Available at pilot end", locked: true }, { status: 409 });
  const body = CfoRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues.map((i) => ({ path: i.path, code: i.code })) }, { status: 400 });
  try {
    const sql = reader();
    const rows = await sql`
      select week, payload from employer.weekly_snapshot where employer_id = ${DEMO_EMPLOYER_ID} and week in ${sql([...MONTH_END_WEEKS])}`;
    const byWeek = new Map(rows.map((r) => [Number(r.week), DashboardSnapshot.parse(r.payload)]));
    const months = MONTH_END_WEEKS.map((w) => byWeek.get(w));
    if (months.some((m) => !m) || !months[2]!.pilotEnd) return Response.json({ error: "no pilot-end data yet: run Reset demo" }, { status: 404 });
    // A re-seed in progress can leave months from two scenarios; the next poll gets a consistent set.
    if (new Set(months.map((m) => m!.scenario)).size > 1) return Response.json({ error: "pilot data is updating, try again" }, { status: 503 });
    return Response.json(CfoView.parse(cfoView(months as MonthSnapshots, body.data.edits)), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("cfo view failed", (e as { code?: string }).code ?? (e as Error).name);
    return Response.json({ error: "pilot decision unavailable" }, { status: 503 });
  }
}
