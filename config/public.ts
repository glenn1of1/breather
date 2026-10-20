// The only constants the browser may import (SEC-3). Each is shown on screen anyway.
// Everything else in config/defaults.ts is server-only.

/** Minimum group size: any value from fewer than N people is suppressed (PRD ENG-4). */
export const MIN_GROUP_SIZE = 5;

export const PILOT_WEEKS = 13;

/** "Before you join" sliders' starting values (headcount, caregiver share in %, places). */
export const PREVIEW_START = { headcount: 100, sharePct: 32.5, places: 12 } as const;
