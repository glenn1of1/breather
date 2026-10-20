// PRD AI-2. On-demand personal-information check (quotes shown in the app were already screened
// offline by scripts/code-themes.ts). Fails closed: if Jev cannot answer, every quote is treated
// as containing personal information.
import { createHash } from "node:crypto";
import { JEV_TIMEOUT_MS } from "@/config/defaults";
import { PiiRequest, PiiResult } from "@/lib/contracts";
import { getJev } from "@/lib/jev";

export async function POST(req: Request) {
  const body = PiiRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "quotes required" }, { status: 400 });
  const quotes = body.data.quotes;
  try {
    const jev = await getJev();
    const p = await jev.containsPII(quotes.map((q) => q.text), AbortSignal.timeout(JEV_TIMEOUT_MS));
    return Response.json(PiiResult.parse({ results: quotes.map((q, i) => ({ quoteHash: q.quoteHash, containsPii: p[i]! >= 0.5, source: jev.name })) }));
  } catch (e) {
    console.error("pii check unavailable, failing closed:", String((e as Error).message).slice(0, 80));
    return Response.json(PiiResult.parse({ results: quotes.map((q) => ({ quoteHash: q.quoteHash ?? createHash("sha256").update(q.text).digest("hex").slice(0, 16), containsPii: true, source: "fail_closed" })) }));
  }
}
