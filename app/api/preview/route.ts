// PRD PRE-1, PRE-2, SEC-3. Before-you-join estimate for the final UI's sliders. Uses the SAME
// costToContinue() as the CFO view, on the server only.
import { PreviewRequest, PreviewResult } from "@/lib/contracts";
import { previewEstimate } from "@/lib/engine/preview";

export async function POST(req: Request) {
  const body = PreviewRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues.map((i) => ({ path: i.path, code: i.code })) }, { status: 400 });
  return Response.json(PreviewResult.parse(previewEstimate(body.data)), { headers: { "Cache-Control": "no-store" } });
}
