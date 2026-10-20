// PRD ENG-4, spec §4.8. Applied before anything is written to the employer schema.
import "server-only";
import { MIN_GROUP_SIZE } from "@/config/defaults";
import { isSuppressed, type SuppressibleNumber } from "@/lib/contracts";

const HIDDEN = { suppressed: true } as const;

/** Hides a count when fewer than MIN_GROUP_SIZE people are behind it. Zero is not hidden. */
export function suppressCount(count: number): SuppressibleNumber {
  return count > 0 && count < MIN_GROUP_SIZE ? HIDDEN : count;
}

/** Hides a mean (or any derived value) when fewer than MIN_GROUP_SIZE people contributed. */
export function suppressDerived(value: number, contributors: number): SuppressibleNumber {
  return contributors < MIN_GROUP_SIZE ? HIDDEN : value;
}

export type HeadlineCounts = {
  potentialCaregivers: number;
  accepted: number;
  droppedOut: number;
  waitlisted: number;
  pending: number;
  cameClose: number;
};

/**
 * Primary + secondary suppression for the headline counts (decision H1).
 * potentialCaregivers = accepted + droppedOut + waitlisted + pending + cameClose, so if any
 * component is hidden, the total is hidden too; otherwise subtraction would reveal it.
 */
export function suppressHeadline(c: HeadlineCounts): Record<keyof HeadlineCounts, SuppressibleNumber> {
  const sum = c.accepted + c.droppedOut + c.waitlisted + c.pending + c.cameClose;
  if (sum !== c.potentialCaregivers) {
    throw new Error(`headline counts do not add up: ${sum} components vs ${c.potentialCaregivers} potential`);
  }
  const accepted = suppressCount(c.accepted);
  const droppedOut = suppressCount(c.droppedOut);
  const waitlisted = suppressCount(c.waitlisted);
  const pending = suppressCount(c.pending);
  const cameClose = suppressCount(c.cameClose);
  const anyHidden = [accepted, droppedOut, waitlisted, pending, cameClose].some(isSuppressed);
  return {
    potentialCaregivers: anyHidden ? HIDDEN : suppressCount(c.potentialCaregivers),
    accepted,
    droppedOut,
    waitlisted,
    pending,
    cameClose,
  };
}
