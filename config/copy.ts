// Caregiver-facing strings. Giada owns the final wording.

export const OUTCOME_COPY = {
  accepted: {
    title: "Your claim has been submitted",
    body: "You have a place in this round. SE Health will contact you to arrange support.",
  },
  waitlisted: {
    title: "Your claim has been submitted",
    body: "All places are taken right now, so you’re on the waitlist. SE Health will contact you if a place opens.",
  },
  pending: {
    title: "Your claim has been submitted",
    body: "More people signed up than there are places. Places are decided on {decidedOn}.",
  },
  not_eligible: {
    title: "Thank you for taking part",
    body: "This round of the pilot can’t include you, but these resources may help.",
  },
} as const;

/** Shown on the not-eligible screen. Giada: replace with the agreed list. */
export const RESOURCES = [
  "Ontario Caregiver Organization helpline: 1-833-416-2273 (24/7)",
  "Your Employee and Family Assistance Program (EFAP)",
  "Talk to SE Health about other caregiver supports",
];

export const PRIVACY_LINE = "We never ask for your name, email or employee ID.";

/** Outcome measure names shown to HR and in the weekly email. */
export const MEASURE_LABELS = {
  work_impact: "How much caregiving affects work (1-7, lower is better)",
  leave_days: "Days of leave used for caregiving last month",
  intent_stay: "Likely to stay in a year (1-7)",
  satisfaction: "Satisfied with support (1-7)",
} as const;
