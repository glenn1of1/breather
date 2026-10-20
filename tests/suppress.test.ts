// ENG-4 + decision H1: primary and secondary suppression of the headline counts.
import { describe, expect, it } from "vitest";
import { suppressHeadline } from "@/lib/engine/suppress";
import { isSuppressed } from "@/lib/contracts";

const H = { suppressed: true };
const base = { accepted: 12, droppedOut: 0, waitlisted: 8, pending: 0, cameClose: 6, potentialCaregivers: 26 };

describe("suppressHeadline (H1)", () => {
  it("shows everything when every component is 0 or >= 5", () => {
    expect(suppressHeadline(base)).toEqual(base);
  });

  it.each(["waitlisted", "cameClose", "droppedOut", "pending", "accepted"] as const)(
    "hides the total when %s is 1-4, so it cannot be recovered by subtraction",
    (key) => {
      const c = { ...base, [key]: 3 };
      c.potentialCaregivers = c.accepted + c.droppedOut + c.waitlisted + c.pending + c.cameClose;
      const out = suppressHeadline(c);
      expect(out[key]).toEqual(H);
      expect(out.potentialCaregivers).toEqual(H);
    },
  );

  it("no visible component plus visible total ever reveals a hidden component", () => {
    for (let w = 0; w <= 9; w++)
      for (let cc = 0; cc <= 9; cc++) {
        const c = { accepted: 12, droppedOut: 0, waitlisted: w, pending: 0, cameClose: cc, potentialCaregivers: 12 + w + cc };
        const out = suppressHeadline(c);
        const hidden = Object.entries(out).filter(([, v]) => isSuppressed(v)).map(([k]) => k);
        // Never exactly one hidden value: one unknown in a visible sum is solvable.
        expect(hidden.length === 1).toBe(false);
      }
  });

  it("throws if the components do not add up (catches engine bugs before they reach the DB)", () => {
    expect(() => suppressHeadline({ ...base, potentialCaregivers: 30 })).toThrow(/do not add up/);
  });
});
