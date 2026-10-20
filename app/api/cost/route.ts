// PRD CFO-2..4. Same pure costToContinue() the sliders call in the browser; this route adds the
// observed weekly hours from the week-13 snapshot (read-only dashboard role).
import type { NextRequest } from "next/server";
import { reader } from "@/db/employer";
import { DEMO_EMPLOYER_ID, PILOT_WEEKS } from "@/config/defaults";
import { CostAssumptions, CostResult, DashboardSnapshot, isSuppressed } from "@/lib/contracts";
import { costToContinue } from "@/lib/engine/cost";

export async function POST(req: NextRequest) {
  const week = Number(req.nextUrl.searchParams.get("week") ?? PILOT_WEEKS);
  if (week < PILOT_WEEKS) return Response.json({ error: "Available at pilot end", locked: true }, { status: 409 });
  const body = CostAssumptions.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues.map((i) => ({ path: i.path, code: i.code })) }, { status: 400 });
  try {
    const [row] = await reader()`
      select payload from employer.weekly_snapshot where employer_id = ${DEMO_EMPLOYER_ID} and week = ${PILOT_WEEKS}`;
    const weekly = row ? DashboardSnapshot.parse(row.payload).usage.weekly.map((w) => (isSuppressed(w.hours) ? null : w.hours)) : undefined;
    return Response.json(CostResult.parse(costToContinue(body.data, weekly)));
  } catch (e) {
    console.error("cost failed", (e as { code?: string }).code ?? (e as Error).name);
    return Response.json({ error: "cost unavailable" }, { status: 503 });
  }
}
