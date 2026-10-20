// DEMO-2 + decision H3: each preset lands on its verdict, alone and with live demo sign-ups.
import { describe, expect, it } from "vitest";
import { buildSnapshots } from "@/lib/aggregate/build-snapshots";
import { generateScenario } from "@/lib/seed/generate";
import { allocate } from "@/lib/engine/allocation";
import { isSuppressed, Scenario } from "@/lib/contracts";
import { liveClaims } from "./helpers/live";

const withLive = (sc: Scenario, k: number) => {
  const d = generateScenario(sc);
  d.claims = [...d.claims, ...liveClaims(k)];
  return d;
};

describe.each(Scenario.options)("scenario %s", (sc) => {
  it("is deterministic", () => {
    expect(generateScenario(sc)).toEqual(generateScenario(sc));
  });

  it("produces 13 valid snapshots with pilotEnd only at week 13", () => {
    const snaps = buildSnapshots(generateScenario(sc));
    expect(snaps.map((s) => s.week)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(snaps.filter((s) => s.pilotEnd).map((s) => s.week)).toEqual([13]);
  });

  it.each([0, 1, 2, 3])("lands on its rules verdict with %i live week-1 sign-ups (H3)", (k) => {
    const d = withLive(sc, k);
    expect(buildSnapshots(d)[12]!.pilotEnd!.signals.rulesCategory).toBe(sc);
    const week1 = allocate(d.claims.map((c) => ({ ...c, dropOutWeek: null })), d.employer.config, 1);
    for (const c of liveClaims(k)) expect(week1.get(c.claimNo)?.status).toBe("accepted");
  });

  it.each([0, 1, 2, 3])("keeps potential caregivers visible at weeks 1 and 13 with %i live sign-ups (H1)", (k) => {
    const snaps = buildSnapshots(withLive(sc, k));
    expect(isSuppressed(snaps[0]!.counts.potentialCaregivers)).toBe(false);
    expect(isSuppressed(snaps[12]!.counts.potentialCaregivers)).toBe(false);
  });

  it("each live sign-up visibly moves the week-1 total (the HR update on stage)", () => {
    const totals = [0, 1, 2, 3].map((k) => buildSnapshots(withLive(sc, k))[0]!.counts.potentialCaregivers);
    expect(totals.every((t, i) => i === 0 || (t as number) === (totals[i - 1] as number) + 1)).toBe(true);
  });
});
