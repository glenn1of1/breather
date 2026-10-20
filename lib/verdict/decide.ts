// PRD CFO-1, AI-1, AI-3, AI-4. Jev answers within the time limit, or the rules engine does.
// Everything Jev-related (including creating the client) happens inside the fallback.
import "server-only";
import { JEV_TIMEOUT_MS } from "@/config/defaults";
import type { PilotEnd, VerdictResult } from "@/lib/contracts";
import type { JevClient } from "@/lib/jev/client";
import { verdictInputs, verdictReasons } from "@/lib/engine/verdict-reasons";

export async function decideVerdict(
  signals: PilotEnd["signals"],
  loadJev: () => Promise<JevClient>,
  timeoutMs = JEV_TIMEOUT_MS,
): Promise<VerdictResult> {
  const rules = signals.rulesCategory;
  let jev: { category: VerdictResult["category"]; confidence: number } | null = null;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const client = await loadJev();
    if (client.name === "jev") {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("jev timeout"));
        }, timeoutMs);
      });
      const v = await Promise.race([client.judgeVerdict(signals, controller.signal), timeout]);
      jev = { category: v.category, confidence: v.confidence };
    }
  } catch (e) {
    console.error("jev unavailable, using rules:", String((e as Error).message).slice(0, 80)); // SDK messages carry no payload data
    jev = null;
  } finally {
    clearTimeout(timer);
  }
  const category = jev?.category ?? rules;
  return {
    category,
    confidence: jev?.confidence ?? null,
    reasons: verdictReasons(signals, category),
    inputs: verdictInputs(signals),
    source: jev ? "jev" : "rules",
    rulesCategory: rules,
    rulesAgree: category === rules,
  };
}
