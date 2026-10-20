"use client";
// Demo state shared by every route. The WEEK is per viewer (which snapshot to look at); the
// SCENARIO lives in the database, so changing it re-seeds and every viewer sees the same data.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { PILOT_WEEKS } from "@/config/public";
import type { Scenario } from "@/lib/contracts";
import { getSnapshot, seed } from "@/lib/client/api";

type DemoState = {
  week: number;
  setWeek: (week: number) => void;
  /** Scenario currently loaded in the database (null until known). */
  scenario: Scenario | null;
  changeScenario: (s: Scenario) => Promise<void>;
  /** Re-seed the current scenario (clears live sign-ups) and go to week 1. */
  reset: () => Promise<void>;
  busy: boolean;
  /** Bumps after any write, so data hooks refetch immediately. */
  version: number;
  bump: () => void;
};

const Ctx = createContext<DemoState | null>(null);
const WEEK_KEY = "breather-week";
const DEFAULT_WEEK = 6;

/** The week is a per-viewer convenience kept in localStorage; storage may be unavailable. */
const weekEvents = new EventTarget();
function readWeek(): number {
  try {
    const saved = Number(localStorage.getItem(WEEK_KEY));
    return saved >= 1 && saved <= PILOT_WEEKS ? saved : DEFAULT_WEEK;
  } catch {
    return DEFAULT_WEEK;
  }
}
function subscribeWeek(cb: () => void) {
  weekEvents.addEventListener("change", cb);
  window.addEventListener("storage", cb);
  return () => {
    weekEvents.removeEventListener("change", cb);
    window.removeEventListener("storage", cb);
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const week = useSyncExternalStore(subscribeWeek, readWeek, () => DEFAULT_WEEK);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Learn (and keep learning) which scenario the database holds.
  useEffect(() => {
    let alive = true;
    const check = () => getSnapshot(1).then((s) => alive && setScenario(s.scenario)).catch(() => undefined);
    check();
    const t = setInterval(check, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [version]);

  const setWeek = useCallback((next: number) => {
    const w = Math.max(1, Math.min(PILOT_WEEKS, Math.round(next)));
    try {
      localStorage.setItem(WEEK_KEY, String(w));
    } catch {
      /* per-viewer convenience only */
    }
    weekEvents.dispatchEvent(new Event("change"));
  }, []);

  const changeScenario = useCallback(
    async (s: Scenario) => {
      setBusy(true);
      try {
        await seed(s);
        setScenario(s);
        bump();
      } finally {
        setBusy(false);
      }
    },
    [bump],
  );

  const reset = useCallback(async () => {
    await changeScenario(scenario ?? "scale");
    setWeek(1);
  }, [changeScenario, scenario, setWeek]);

  const value = useMemo(
    () => ({ week, setWeek, scenario, changeScenario, reset, busy, version, bump }),
    [week, setWeek, scenario, changeScenario, reset, busy, version, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo must be used inside DemoProvider");
  return v;
}
