"use client";
// Browser-side data access. Every response is validated against lib/contracts.ts.
import { useEffect, useRef, useState } from "react";
import { CfoView, DashboardSnapshot, PreviewResult, SurveyResult, VerdictResult, type CfoEdits, type PreviewRequest, type Scenario, type SurveyAnswers } from "@/lib/contracts";

export const POLL_MS = 5_000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function json<T>(res: Response, parse: (v: unknown) => T): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? `request failed (${res.status})`);
  return parse(body);
}

export const getSnapshot = (week: number, signal?: AbortSignal) =>
  fetch(`/api/dashboard?week=${week}`, { signal, cache: "no-store" }).then((r) => json(r, (v) => DashboardSnapshot.parse(v)));

export const getVerdict = (signal?: AbortSignal) =>
  fetch("/api/verdict", { method: "POST", signal, cache: "no-store" }).then((r) => json(r, (v) => VerdictResult.parse(v)));

const post = (path: string, body: unknown, signal?: AbortSignal) =>
  fetch(path, { method: "POST", signal, cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** SEC-3: the CFO numbers for the given slider edits, computed on the server. */
export const getCfo = (edits: CfoEdits, signal?: AbortSignal) => post("/api/cfo", { edits }, signal).then((r) => json(r, (v) => CfoView.parse(v)));

/** SEC-3: the before-you-join estimate, computed on the server. */
export const getPreview = (input: PreviewRequest, signal?: AbortSignal) => post("/api/preview", input, signal).then((r) => json(r, (v) => PreviewResult.parse(v)));

/** Slider moves wait this long for the next move before asking the server. */
export const SLIDER_DEBOUNCE_MS = 120;

export const seed = (scenario: Scenario) => fetch(`/api/demo/seed?scenario=${scenario}`, { method: "POST" }).then((r) => json(r, (v) => v));

export const submitSurvey = (token: string, answers: SurveyAnswers) =>
  fetch("/api/survey", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, answers }) }).then((r) =>
    json(r, (v) => SurveyResult.parse(v)),
  );

export type Loaded<T> = { data: T | null; error: string | null; loading: boolean };

/**
 * Polls one week's snapshot (HR stays live with no manual step). When the week changes, the
 * request in flight is aborted and any response for another week is dropped.
 */
export function useSnapshot(week: number, version: number, poll = true): Loaded<DashboardSnapshot> {
  const [state, setState] = useState<Loaded<DashboardSnapshot>>({ data: null, error: null, loading: true });
  const current = useRef(week);
  useEffect(() => {
    current.current = week;
    let controller = new AbortController();
    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const data = await getSnapshot(week, controller.signal);
        if (current.current === data.week) setState({ data, error: null, loading: false });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setState((s) => ({ data: s.data?.week === week ? s.data : null, error: (e as Error).message, loading: false }));
      }
    };
    setState((s) => ({ data: s.data?.week === week ? s.data : null, error: null, loading: s.data?.week !== week }));
    load();
    const timer = poll ? setInterval(load, POLL_MS) : undefined;
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [week, version, poll]);
  return state;
}
