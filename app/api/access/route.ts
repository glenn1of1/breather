// SEC-1. Exchanges an access code for the signed demo cookie. Works as a plain HTML form post
// (303 back to the demo, or to /access with an error) and as JSON for scripts and tests.
// Attempts are rate-limited per IP so codes can't be guessed.
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE_S, accessConfigured, checkCode, issueCookie, safeNext } from "@/lib/security/access";
import { ACCESS_PER_IP, clientIp, hit, tooMany } from "@/lib/security/rate-limit";

async function readBody(req: NextRequest): Promise<{ code: string; next: string | null; json: boolean }> {
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as { code?: unknown; next?: unknown } | null;
    return { code: typeof body?.code === "string" ? body.code : "", next: typeof body?.next === "string" ? body.next : null, json: true };
  }
  const form = await req.formData().catch(() => null);
  const code = form?.get("code");
  const next = form?.get("next");
  return { code: typeof code === "string" ? code : "", next: typeof next === "string" ? next : null, json: false };
}

export async function POST(req: NextRequest) {
  const limited = hit(ACCESS_PER_IP, clientIp(req.headers));
  if (!limited.ok) return tooMany(limited.retryAfterS);

  const { code, next, json } = await readBody(req);
  const destination = safeNext(next);
  const codeId = code.length > 0 && code.length <= 200 ? checkCode(code) : null;

  if (!codeId) {
    const error = accessConfigured() ? "invalid" : "unavailable";
    if (json) return NextResponse.json({ error: error === "invalid" ? "that code didn't work" : "demo access is not available right now" }, { status: 401 });
    const back = new URL("/access", req.url);
    back.searchParams.set("error", error);
    back.searchParams.set("next", destination);
    return NextResponse.redirect(back, 303);
  }

  const res = json ? NextResponse.json({ ok: true, next: destination }) : NextResponse.redirect(new URL(destination, req.url), 303);
  res.cookies.set(ACCESS_COOKIE, issueCookie(codeId), {
    httpOnly: true,
    // Always on Vercel and any https origin; plain-http localhost (dev, CI) would drop a Secure cookie.
    secure: process.env.VERCEL === "1" || req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_S,
  });
  return res;
}
