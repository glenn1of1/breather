// SEC-1, SEC-2. The gate in front of the live demo (/demo/**) and its API (/api/**, except
// /api/access). Without a valid access cookie, pages redirect to /access and API calls get 401.
// With one, API calls are rate-limited per IP, and Jev routes also per session.
// (Next 16 renamed middleware.ts to proxy.ts; it runs on the Node.js runtime.)
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, readAccess } from "@/lib/security/access";
import { API_PER_IP, clientIp, hit, JEV_PER_IP, JEV_PER_SESSION, SEED_PER_IP, tooMany, type Limit } from "@/lib/security/rate-limit";

/** Routes that can call Jev (judgeVerdict, containsPII). */
const JEV_ROUTES = new Set(["/api/verdict", "/api/pii"]);

function limitsFor(path: string): [Limit, "ip" | "session"][] {
  if (JEV_ROUTES.has(path)) return [[JEV_PER_IP, "ip"], [JEV_PER_SESSION, "session"]];
  if (path === "/api/demo/seed") return [[SEED_PER_IP, "ip"], [API_PER_IP, "ip"]];
  return [[API_PER_IP, "ip"]];
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const access = readAccess(req.cookies.get(ACCESS_COOKIE)?.value);
  const isApi = path.startsWith("/api/");

  if (!access) {
    if (isApi) return NextResponse.json({ error: "demo access required" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/access";
    url.search = "";
    url.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isApi) {
    const ip = clientIp(req.headers);
    for (const [limit, by] of limitsFor(path)) {
      const r = hit(limit, by === "ip" ? ip : access.sessionId);
      if (!r.ok) return tooMany(r.retryAfterS);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/demo/:path*", "/api/((?!access$).*)"],
};
