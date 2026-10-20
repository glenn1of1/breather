// PRD HR-7. Simulated "submit monthly report to SE Health": returns a receipt, sends nothing.
import { randomInt } from "node:crypto";
import { z } from "zod";
import { ReportReceipt } from "@/lib/contracts";

const Body = z.object({ month: z.number().int().min(1).max(3) });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "month must be 1, 2 or 3" }, { status: 400 });
  const now = new Date();
  const receiptId = `SEH-${now.getUTCFullYear()}-M${body.data.month}-${String(randomInt(10_000)).padStart(4, "0")}`;
  return Response.json(ReportReceipt.parse({ receiptId, submittedAt: now.toISOString() }));
}
