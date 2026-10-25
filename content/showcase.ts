// SHOW-1. Every word on the public showcase (/) lives here, so wording changes never touch components.
// Rules: no SE Health logos or brand assets (text mentions only), no invented facts, quotes or
// metrics, and nothing about formulas, thresholds, weights, prompts or question wording.
// Anything we don't know yet is a `TODO:` placeholder.

/** Links and photo are plain strings so an empty one (hidden) and a filled one type-check the same way. */
type TeamMember = { name: string; role: string; detail: string; linkedin: string; github: string; photo: string };

export const ACCESS_EMAIL = "hello@breather.dev";
// The public, view-only snapshot of this repo.
export const SOURCE_URL = "https://github.com/glenn1of1/breather";

export const showcase = {
  meta: {
    title: "Breather · Catalyst 2026 Finalist",
    description:
      "Breather helps an employer run a 3-month caregiver-benefit pilot without the admin or privacy risk, then decide to scale, sustain or stop with evidence. Built for SE Health's Respite for All challenge.",
    ogAlt: "Breather: run a caregiver-benefit pilot, then decide to scale, sustain or stop. Catalyst 2026 finalist, SE Health case study.",
  },

  hero: {
    name: "Breather",
    badge: "Catalyst 2026 Finalist · SE Health case study",
    tagline: "Run a caregiver-benefit pilot without the admin, then decide what happens next with evidence instead of guesswork.",
    context:
      "Built in 48 hours for SE Health’s Respite for All challenge at Catalyst 2026, a case-study hackathon hosted by Speer Technologies at Northeastern University Toronto (October 16–18, 2026).",
    primaryCta: "Request demo access",
    secondaryCta: "How it works",
    accessSubject: "Breather demo access request",
    accessBody: "Hi Glenn,\n\nI'd like an access code for the Breather live demo.\n\nName:\nOrganization:\n\nThanks!",
    haveCode: "Have an access code?",
    openDemo: "Open the live demo",
    viewSource: "View the source",
    // The decorative cards beside the headline (hidden from screen readers; they repeat the copy below).
    art: {
      label: "Pilot decision · week 13",
      verdict: "Scale",
      options: ["Scale", "Sustain", "Stop"],
      note: "Breather recommends; you decide.",
      cards: [
        { title: "Anonymous", body: "No name, email or employee ID" },
        { title: "Totals only", body: "Small counts hidden" },
      ],
    },
  },

  nav: [
    { href: "#problem", label: "Problem" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#under-the-hood", label: "Under the hood" },
    { href: "#privacy", label: "Privacy" },
    { href: "#team", label: "Team" },
  ],

  problem: {
    eyebrow: "The problem",
    title: "Employers like the idea. Then the pilot stalls.",
    challenge:
      "“How can technology help employers confidently adopt, evaluate, and scale caregiver-support benefits without creating unnecessary administrative burden, privacy concerns, or uncertainty around long-term costs?”",
    challengeSource: "SE Health, Respite for All challenge brief",
    framing:
      "SE Health’s brief is clear that funding isn’t the bottleneck: recruiting employers is. Employers hesitate for three reasons.",
    points: [
      { title: "Cost after the funding ends", body: "The pilot is grant-funded. Nobody wants to start a benefit they may have to take away, with no way to know what continuing would cost." },
      { title: "Admin load", body: "HR teams are small and already stretched. A pilot that adds paperwork is a pilot that never starts." },
      { title: "Employee privacy", body: "Caregivers won’t sign up if they think their employer will know it’s them, yet the employer still needs proof the pilot is working." },
    ],
    figures: [
      { value: "~35%", label: "of the Canadian workforce are working caregivers (6.1M employees)", source: "CCCE via Benefits Canada, May 2025" },
      { value: "62%", label: "of HR leaders don’t know how many caregivers they employ", source: "CCCE" },
      { value: "79% vs 7%", label: "of caregivers rate respite as important, versus those who have actually used it", source: "CCCE, Caring in Canada 2026" },
      { value: "8–10", label: "employers in the Respite for All pilot, up to 3 months each, grant-funded", source: "SE Health challenge brief" },
    ],
  },

  how: {
    eyebrow: "How it works",
    title: "Three layers. Data flows one way.",
    intro:
      "Breather runs an employer’s 3-month pilot from sign-up to decision. Personal data stays with SE Health, the care provider. The employer pays for the benefit but only ever sees company-wide totals, much like insurance: you fund the plan, you never see who claims.",
    layers: [
      {
        who: "Caregivers",
        title: "An anonymous, one-minute survey",
        body: "No name, email or employee ID. Reaching the employer’s private link is the proof of employment. A plain-rules eligibility engine answers on the spot: accepted with a random claim number, waitlisted in priority order, or not eligible right now.",
      },
      {
        who: "HR",
        title: "Company-wide totals, nothing more",
        body: "Potential caregivers, accepted, waitlisted, usage, trends against the baseline, and focus-group themes. No department breakdown, and a minimum group size hides small counts.",
      },
      {
        who: "CFO",
        title: "Scale, sustain or stop",
        body: "A recommendation from the employer’s own pilot data, with its reasons, a low / base / high cost to continue, and a projection drawn as a widening band: a projection, not a prediction. The assumptions are editable.",
      },
    ],
    flowNote: "Caregivers → SE Health → the employer, as totals. Nothing flows back the other way.",
  },

  engine: {
    eyebrow: "Under the hood",
    title: "Plain rules where they belong, AI where it helps.",
    intro: "All decision logic runs on the server. The browser only ever receives results.",
    steps: [
      { title: "Eligibility engine", body: "Plain, auditable rules decide each sign-up on the spot. A priority score orders the waitlist." },
      { title: "Privacy-first aggregation", body: "Answers are turned into company-wide totals. Small groups are hidden before anything reaches the employer’s side of the database." },
      { title: "Jev decision model", body: "Jev, TypeSafe AI’s decision model, scores the evidence and assigns scale, sustain or stop, always with its inputs and reasons. It also checks focus-group quotes for personal information. A rules engine cross-checks it and takes over if Jev is unavailable." },
      { title: "Cost and projection", body: "A low / base / high cost to continue, built from the pilot’s own usage, and a 12-month projection band that widens with the horizon." },
    ],
    architecture: {
      title: "Architecture",
      caption: "Two database roles enforce the privacy wall: the dashboard role can’t read individual answers at all.",
      browser: { label: "Browser", items: ["Caregiver survey", "HR dashboard", "CFO decision"] },
      server: { label: "Next.js server (route handlers)", items: ["Eligibility + priority", "Aggregation + small-count suppression", "Cost model + projection", "Jev client + rules fallback"] },
      data: [
        { label: "Intake schema", note: "Individual answers. Writer role only." },
        { label: "Employer schema", note: "Totals only. Read-only dashboard role." },
      ],
      ai: { label: "Jev by TypeSafe AI", note: "via @typesafe-ai/sdk" },
    },
    stack: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Postgres on Supabase", "Jev via @typesafe-ai/sdk", "Zod contracts", "Recharts", "Vercel", "Vitest, Playwright, axe"],
    costFigure: { value: "~$0.0032", label: "AI cost per full run", source: "Our measured Jev usage" },
  },

  privacy: {
    eyebrow: "Privacy & responsible AI",
    title: "Privacy the code enforces, not just the pitch.",
    points: [
      { title: "Anonymous by design", body: "The survey never asks for a name, email or employee ID." },
      { title: "Aggregates only", body: "The employer sees company-wide totals. There are no department, team or location breakdowns." },
      { title: "Minimum group size", body: "Any number from too few people is hidden before it is stored where the employer can read it." },
      { title: "Personal-info filter", body: "Focus-group quotes are checked for names, contact details and other identifiers. If the check can’t run, the quotes are dropped." },
      { title: "AI recommends, a person decides", body: "Every recommendation shows its inputs and reasons, and the rules engine’s view alongside. The CFO makes the call." },
      { title: "Synthetic data only", body: "Every number in the demo is synthetic. Northwind Logistics is a fictional employer." },
    ],
  },

  screens: {
    eyebrow: "See it",
    title: "The pilot, start to finish",
    // Captured from the live demo at 1600×1000, cropped to the screen content so no SE Health logo shows.
    shots: [
      { src: "/showcase/survey.webp", alt: "The caregiver check-in: a notice that it is anonymous and asks for no name, email or employee ID, then the first two questions with large answer buttons.", caption: "Caregiver survey: anonymous, about a minute, instant result." },
      { src: "/showcase/hr-dashboard.webp", alt: "The HR dashboard at week 6: 26 potential caregivers, 12 active, 46.5 care hours and 8 on the waitlist, a participation chart, and care hours by week, with the smallest service group shown as “<5”.", caption: "HR dashboard: company-wide totals, small counts hidden." },
      { src: "/showcase/cfo-decision.webp", alt: "The CFO decision at week 13: Scale, with Jev AI at 100% confidence, the rules engine agreeing, three reasons, and the pilot’s signals charted against a reference line.", caption: "CFO decision: a recommendation with its reasons." },
      { src: "/showcase/cfo-projection.webp", alt: "The cost to continue as a low, base and high yearly range, adjustable cost assumptions, and a projection band that widens over 12 months.", caption: "Cost to continue: a range and a widening projection band." },
    ],
  },

  team: {
    eyebrow: "Team",
    title: "Built by four people in 48 hours",
    // Display names confirmed by the team; surnames from LICENSE. An empty link hides that button.
    // TODO: profile photos. Add a square image (at least 256×256) to public/team/ and set `photo`,
    // e.g. "/team/glenn.jpg". An empty string shows the initials instead.
    members: [
      { name: "Glenn Salvador", role: "Backend and architecture", detail: "Data pipeline, eligibility engine, scoring, API", linkedin: "https://www.linkedin.com/in/glenn-salvador/", github: "https://github.com/glenn1of1", photo: "" },
      { name: "Victoria Chernobay", role: "Frontend and UI", detail: "Interface design and build", linkedin: "https://www.linkedin.com/in/chernobayv/", github: "https://github.com/chernobayv", photo: "" },
      { name: "Chay Suthahar", role: "Project manager", detail: "Project management, code review and PR approvals", linkedin: "https://www.linkedin.com/in/chayanth/", github: "https://github.com/Chayanths312", photo: "" },
      { name: "Giada Laceda", role: "Research and pitch", detail: "Research, pitch and presentation", linkedin: "https://www.linkedin.com/in/giada-laceda/", github: "", photo: "" },
    ] as readonly TeamMember[],
  },

  footer: {
    ctaTitle: "Want to see it run?",
    ctaBody: "The live demo is private. Ask for an access code and we’ll send one.",
    // Names as in LICENSE.
    copyright: "© 2026 Glenn Salvador, Victoria Chernobay, Giada Laceda and Chayanth Suthahar. All rights reserved. Source code published for viewing only.",
    sourceLink: "View the source on GitHub",
    disclaimer: "Built for SE Health’s Respite for All challenge at Catalyst 2026. Not affiliated with or endorsed by SE Health or Speer.",
  },
} as const;

export const accessMailto = () =>
  `mailto:${ACCESS_EMAIL}?subject=${encodeURIComponent(showcase.hero.accessSubject)}&body=${encodeURIComponent(showcase.hero.accessBody)}`;
