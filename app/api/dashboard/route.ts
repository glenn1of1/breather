// PRD HR-1..4. Reads one pre-computed, already-suppressed snapshot through the read-only
// dashboard role (db/employer). This route must never import db/intake (ESLint-enforced).
import type { NextRequest } from "next/server";
import { reader } from "@/db/employer";
import { DEMO_EMPLOYER_ID, PILOT_WEEKS } from "@/config/defaults";
import { DashboardSnapshot } from "@/lib/contracts";

export async function GET(req: NextRequest) {
  const week = Number(req.nextUrl.searchParams.get("week") ?? PILOT_WEEKS);
  if (!Number.isInteger(week) || week < 1 || week > PILOT_WEEKS) {
    return Response.json({ error: "week must be 1-13" }, { status: 400 });
  }
  try {
    const [row] = await reader()`
      select payload from employer.weekly_snapshot where employer_id = ${DEMO_EMPLOYER_ID} and week = ${week}`;
    if (!row) return Response.json({ error: "no data yet: run Reset demo" }, { status: 404 });
    return Response.json(DashboardSnapshot.parse(row.payload), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("dashboard read failed", (e as { code?: string }).code ?? "unknown");
    return Response.json({ error: "dashboard unavailable" }, { status: 503 });
  }
}
