// Every external figure shown on screen, with its source (PRD AI-5).
// Source: SE Health "Employer Pain Points" brief (Oct 2026) unless noted.

export type Source = { id: string; figure: string; value: string; source: string; note?: string };

export const SOURCES: Source[] = [
  { id: "caregiver-share", figure: "Working caregivers in the labour force", value: "about 35% (6.1M employees)", source: "CCCE via Benefits Canada, May 2025" },
  { id: "caregiver-proxy", figure: "Caregiver proxy", value: "30–35% of workforce", source: "SE Health estimate", note: "An estimate, not a count" },
  { id: "hr-unknown", figure: "HR leaders who don't know their caregiver numbers", value: "62%", source: "CCCE" },
  { id: "respite-gap", figure: "Respite: important vs. used", value: "79% vs. 7%", source: "CCCE Caring in Canada 2026" },
  { id: "phase1-outcomes", figure: "Phase 1 outcomes", value: "88% stress relief, 86% better work–care balance", source: "SE Health Phase 1 (110 caregivers)", note: "Illustrative only" },
  { id: "phase1-mix", figure: "Phase 1 service mix", value: "household 47%, companionship 30%, personal care 18%", source: "SE Health Phase 1" },
  { id: "hr-time", figure: "HR time once running", value: "less than half a day a week", source: "SE Health estimate" },
  { id: "pilot-funding", figure: "Pilot funding", value: "up to about $500 per caregiver, ends Mar 31, 2027", source: "Petro-Canada CareMakers Foundation grant" },
  { id: "provider-rate", figure: "Provider hourly rate", value: "$50/hour", source: "Assumption: Phase 1 ($500 ≈ 10 hours)" },
  { id: "admin-fee", figure: "Admin fee", value: "15%", source: "Assumption: team estimate, illustrative" },
];
