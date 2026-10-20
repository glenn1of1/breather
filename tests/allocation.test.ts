// ENG-3: table-driven replay cases, including decision D3 ("accepted stays accepted").
import { describe, expect, it } from "vitest";
import { allocate, countStatuses, type AllocationInput } from "@/lib/engine/allocation";

const cfg = { places: 3, enrolmentWindowWeeks: 2 };
let seq = 0;
const claim = (pilotWeek: number, priority: number, opts: Partial<AllocationInput> = {}): AllocationInput => ({
  claimNo: `C${String(++seq).padStart(3, "0")}`,
  submittedAt: new Date(Date.UTC(2026, 9, 1, 0, seq)),
  pilotWeek,
  eligible: true,
  priority,
  dropOutWeek: null,
  ...opts,
});
const status = (m: ReturnType<typeof allocate>, c: AllocationInput) => m.get(c.claimNo)?.status;

describe("allocate (ENG-3)", () => {
  it("in the window and under capacity: everyone is accepted", () => {
    const cs = [claim(1, 1), claim(1, 5), claim(2, 2)];
    const m = allocate(cs, cfg, 2);
    expect(cs.map((c) => status(m, c))).toEqual(["accepted", "accepted", "accepted"]);
  });

  it("oversubscribed in the window: later sign-ups are pending until the window closes", () => {
    const cs = [claim(1, 1), claim(1, 1), claim(1, 1), claim(1, 8)];
    expect(status(allocate(cs, cfg, 1), cs[3]!)).toBe("pending");
  });

  it("D3: accepted stays accepted; once the window is full, later sign-ups wait for window close", () => {
    const a = claim(1, 0), b = claim(1, 0), c = claim(1, 0); // fill all 3 places on arrival
    const p1 = claim(2, 2), p2 = claim(2, 7), p3 = claim(2, 5); // no place free: pending, then waitlisted
    const m = allocate([a, b, c, p1, p2, p3], cfg, 2);
    expect([a, b, c].map((x) => status(m, x))).toEqual(["accepted", "accepted", "accepted"]);
    expect([p1, p2, p3].map((x) => status(m, x))).toEqual(["waitlisted", "waitlisted", "waitlisted"]);
    // Low-priority early arrivals keep their places even though higher-priority people came later.
    expect(Math.max(a.priority!, b.priority!, c.priority!)).toBeLessThan(p2.priority!);
  });

  it("window close gives places freed during the window to the highest-priority pending people", () => {
    const tight = { places: 2, enrolmentWindowWeeks: 2 };
    const a = { ...claim(1, 0), dropOutWeek: 2 }; // frees a place inside the window
    const b = claim(1, 0);
    const low = claim(1, 1), high = claim(2, 8);  // both pending (no place free on arrival)
    const m1 = allocate([a, b, low, high], tight, 1);
    expect(status(m1, low)).toBe("pending");
    const m2 = allocate([a, b, low, high], tight, 2);
    expect(status(m2, a)).toBe("dropped_out");
    expect(status(m2, high)).toBe("accepted"); // priority beats arrival order at window close
    expect(status(m2, low)).toBe("waitlisted");
    expect(m2.get(high.claimNo)?.acceptedWeek).toBe(2);
  });

  it("ties at window close go to the earlier sign-up", () => {
    const c1 = claim(1, 0), c2 = claim(1, 0), c3 = claim(1, 0); // full
    const early = claim(1, 5), late = claim(2, 5);             // both pending, same priority
    const cs = [c1, c2, c3, early, late];
    const m = allocate(cs, { places: 3, enrolmentWindowWeeks: 2 }, 3);
    expect(status(m, early)).toBe("waitlisted");
    expect(status(m, late)).toBe("waitlisted");
    // When a place frees up, the earlier of the tied pair gets it.
    const drop = { ...c1, dropOutWeek: 4 };
    const m2 = allocate([drop, c2, c3, early, late], { places: 3, enrolmentWindowWeeks: 2 }, 4);
    expect(status(m2, drop)).toBe("dropped_out");
    expect(status(m2, early)).toBe("accepted");
    expect(status(m2, late)).toBe("waitlisted");
  });

  it("after the window: rolling fill, then a priority-ordered waitlist", () => {
    const cs = [claim(1, 0), claim(1, 0), claim(3, 1), claim(4, 2), claim(5, 9)];
    const m = allocate(cs, cfg, 5);
    expect(cs.map((c) => status(m, c))).toEqual(["accepted", "accepted", "accepted", "waitlisted", "waitlisted"]);
    // Priority 9 (week 5) jumps ahead of priority 2 (week 4) when a place frees.
    const withDrop = [{ ...cs[0]!, dropOutWeek: 6 }, ...cs.slice(1)];
    const m2 = allocate(withDrop, cfg, 6);
    expect(status(m2, cs[4]!)).toBe("accepted");
    expect(status(m2, cs[3]!)).toBe("waitlisted");
  });

  it("a newcomer never jumps an existing waitlist, even if a place is free that week", () => {
    const cs = [claim(1, 0), claim(1, 0), claim(1, 0), claim(3, 9)];
    const drop = { ...cs[0]!, dropOutWeek: 4 };
    const late = claim(4, 9);
    const m = allocate([drop, ...cs.slice(1), late], cfg, 4);
    expect(status(m, cs[3]!)).toBe("accepted"); // waitlisted person takes the freed place first
    expect(status(m, late)).toBe("waitlisted");
  });

  it("not eligible never takes a place", () => {
    const ne = claim(1, 8, { eligible: false });
    const m = allocate([ne, claim(1, 0)], cfg, 13);
    expect(status(m, ne)).toBe("not_eligible");
    expect(countStatuses(m)).toMatchObject({ accepted: 1, not_eligible: 1 });
  });

  it("is deterministic and ignores input order", () => {
    const cs = Array.from({ length: 12 }, (_, i) => claim(1 + (i % 4), i % 5));
    const a = allocate(cs, cfg, 13), b = allocate([...cs].reverse(), cfg, 13);
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
  });

  it("asOfWeek ignores later sign-ups and never moves an accepted person", () => {
    const cs = Array.from({ length: 10 }, (_, i) => claim(1 + i, 10 - i));
    for (let w = 1; w < 13; w++) {
      const now = allocate(cs, cfg, w), next = allocate(cs, cfg, w + 1);
      for (const [k, v] of now) if (v.status === "accepted") expect(next.get(k)?.status).toBe("accepted");
      expect([...now.keys()].every((k) => cs.find((c) => c.claimNo === k)!.pilotWeek <= w)).toBe(true);
    }
  });
});
