// Picks live or mock Jev (AI-4). JEV_MODE=mock is the default; live needs JEV_MODE=live.
// Every live call first takes one call from the daily budget (SEC-2); over the cap it throws, which
// callers already treat as "Jev unavailable" (rules fallback, PII check fails closed).
import "server-only";
import type { JevClient } from "./client";
import { JevCapReached, takeJevCall } from "./budget";
import { mockJev } from "./mock";

let warned = "";
function budgeted(): void {
  if (takeJevCall()) return;
  const today = new Date().toISOString().slice(0, 10);
  if (warned !== today) {
    warned = today;
    console.warn("jev daily call cap reached; using the rules engine until midnight UTC");
  }
  throw new JevCapReached();
}

export async function getJev(): Promise<JevClient> {
  if (process.env.JEV_MODE !== "live") return mockJev;
  const { liveJev } = await import("./live");
  return {
    name: liveJev.name,
    async judgeVerdict(signals, signal) {
      budgeted();
      return liveJev.judgeVerdict(signals, signal);
    },
    async containsPII(quotes, signal) {
      if (quotes.length) budgeted(); // an empty list makes no call
      return liveJev.containsPII(quotes, signal);
    },
  };
}

export { mockJev };
