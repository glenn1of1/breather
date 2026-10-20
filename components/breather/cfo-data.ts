"use client";
// CFO data for the final UI: the verdict (Jev or rules), the server-computed CFO view (SEC-3) and the
// design's verdict copy.
import { useEffect, useState } from "react";
import type { CfoEdits, CfoView, Scenario, VerdictResult } from "@/lib/contracts";
import { getCfo, getVerdict, POLL_MS, SLIDER_DEBOUNCE_MS } from "@/lib/client/api";

const COUNT = ["none", "one", "two", "three", "all four"] as const;

/** Design copy per verdict, with the real number of improved measures where the design states one. */
export const VERDICT_COPY: Record<Scenario, { title: string; line: (improved: number) => string; staff: string }> = {
  scale: {
    title: "Scale",
    line: (n) => `Demand is strong and ${n >= 4 ? "all four" : `${COUNT[n] ?? n} of four`} company-wide outcomes improved.`,
    staff: "Tell staff the benefit continues and will grow, so more people who help someone can join.",
  },
  sustain: {
    title: "Sustain",
    line: () => "The pilot is helping, while demand and outcomes support holding steady.",
    staff: "Tell staff the benefit continues at its current size, and how to join the waitlist if it fills.",
  },
  stop: {
    title: "Stop",
    line: () => "The rules table did not find enough company-wide evidence to continue.",
    staff: "Tell staff the pilot has ended, thank them, and share other caregiver resources.",
  },
};

/**
 * Asks /api/verdict once per data version (scenario + writes). It depends on `key` and readiness,
 * NOT on a snapshot object: polling replaces snapshots every 5 s and must not re-ask Jev each time.
 */
export function useVerdict(key: string, ready: boolean) {
  const [stored, setStored] = useState<{ key: string; verdict: VerdictResult | null; error: string | null }>({ key: "", verdict: null, error: null });
  useEffect(() => {
    if (!ready) return;
    const c = new AbortController();
    getVerdict(c.signal).then(
      (verdict) => setStored({ key, verdict, error: null }),
      (e) => (e as Error).name !== "AbortError" && setStored({ key, verdict: null, error: (e as Error).message }),
    );
    return () => c.abort();
  }, [key, ready]);
  return stored.key === key ? stored : { key, verdict: null, error: null };
}

/**
 * SEC-3: the CFO numbers come from /api/cfo. Polls like the week-13 snapshot did (live sign-ups show
 * up), asks again when the data version or the slider edits change (after a short debounce), and
 * keeps the last good view on screen while the next one loads.
 */
export function useCfoView(version: number, edits: CfoEdits) {
  const [state, setState] = useState<{ view: CfoView | null; error: string | null }>({ view: null, error: null });
  useEffect(() => {
    let controller = new AbortController();
    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const view = await getCfo(edits, controller.signal);
        setState({ view, error: null });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setState((s) => ({ view: s.view, error: (e as Error).message }));
      }
    };
    const first = setTimeout(load, SLIDER_DEBOUNCE_MS);
    const timer = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      controller.abort();
    };
  }, [version, edits]);
  return state;
}
