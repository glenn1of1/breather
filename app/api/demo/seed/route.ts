// PRD DEMO-2. Replace the demo data with a scenario and recompute. Open by design (no auth, PRD §3).
import type { NextRequest } from "next/server";
import { writer } from "@/db/intake";
import { Scenario, SeedResult } from "@/lib/contracts";
import { seedScenario } from "@/lib/seed/load";

export async function POST(req: NextRequest) {
  const parsed = Scenario.safeParse(req.nextUrl.searchParams.get("scenario") ?? "scale");
  if (!parsed.success) return Response.json({ error: "scenario must be scale, sustain or stop" }, { status: 400 });
  const t0 = Date.now();
  try {
    const { claims } = await seedScenario(writer(), parsed.data);
    return Response.json(SeedResult.parse({ scenario: parsed.data, claims, ms: Date.now() - t0 }));
  } catch (e) {
    console.error("seed failed", (e as { code?: string }).code ?? "unknown"); // codes only, never row data (H5)
    return Response.json({ error: "seed failed" }, { status: 500 });
  }
}
