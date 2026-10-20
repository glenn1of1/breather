// PRD CFO-1, CFO-6, AI-1, AI-3, AI-4. Reads the week-13 snapshot through the read-only dashboard
// role; Jev sees only the already-suppressed signals; the rules engine answers if Jev cannot.
import type { NextRequest } from "next/server";
import { reader } from "@/db/employer";
import { DEMO_EMPLOYER_ID, PILOT_WEEKS } from "@/config/defaults";
import { DashboardSnapshot, VerdictResult } from "@/lib/contracts";
import { getJev } from "@/lib/jev";
import { decideVerdict } from "@/lib/verdict/decide";

export async function POST(req: NextRequest) {
  const week = Number(req.nextUrl.searchParams.get("week") ?? PILOT_WEEKS);
  // CFO-6: enforced on the server, not only hidden in the UI.
  if (week < PILOT_WEEKS) return Response.json({ error: "Available at pilot end", locked: true }, { status: 409 });
  try {
    const [row] = await reader()`
      select payload from employer.weekly_snapshot where employer_id = ${DEMO_EMPLOYER_ID} and week = ${PILOT_WEEKS}`;
    const pilotEnd = row ? DashboardSnapshot.parse(row.payload).pilotEnd : null;
    if (!pilotEnd) return Response.json({ error: "no pilot-end data yet: run Reset demo" }, { status: 404 });
    return Response.json(VerdictResult.parse(await decideVerdict(pilotEnd.signals, getJev)), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("verdict failed", (e as { code?: string }).code ?? (e as Error).name);
    return Response.json({ error: "verdict unavailable" }, { status: 503 });
  }
}
