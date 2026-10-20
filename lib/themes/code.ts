// HR-5 + AI-2. Turns synthetic focus-group excerpts into themes with screened quotes.
// Jev (or the mock) sorts each excerpt into a FIXED theme list (Jev returns labels, not text).
// A theme is kept only if at least N different people raised it. Quotes are screened for
// personal information BEFORE they are stored; if the check cannot run, quotes are dropped
// (fail closed), so unscreened text never reaches the dashboard-readable employer schema.
import "server-only";
import { createHash } from "node:crypto";
import { MIN_GROUP_SIZE } from "@/config/defaults";
import type { ThemeRow } from "@/lib/aggregate/types";

export const THEMES = {
  time_for_work: "Time and focus back for work",
  less_guilt: "Easier and less guilty to ask for help",
  booking_confusing: "Booking and scheduling is confusing",
  trust_in_carers: "Trust in the carers",
  after_funding: "Worry about when the funding ends",
  other: "Other",
} as const;
export type ThemeKey = keyof typeof THEMES;

export type Excerpt = { speaker: string; text: string };

export interface ThemeCoder {
  readonly name: "jev" | "mock";
  classify(texts: string[]): Promise<ThemeKey[]>;
  /** Probability each quote contains personal information. Throwing = the check could not run. */
  containsPII(texts: string[]): Promise<number[]>;
}

const MAX_QUOTES = 2;
const MAX_QUOTE_LENGTH = 140;
const PII_THRESHOLD = 0.5;
export const quoteHash = (t: string) => createHash("sha256").update(t).digest("hex").slice(0, 16);

export async function codeThemes(excerpts: Excerpt[], coder: ThemeCoder): Promise<ThemeRow[]> {
  const labels = await coder.classify(excerpts.map((e) => e.text));
  const byTheme = new Map<ThemeKey, Excerpt[]>();
  excerpts.forEach((e, i) => {
    const k = labels[i]!;
    if (k !== "other") byTheme.set(k, [...(byTheme.get(k) ?? []), e]);
  });

  const out: ThemeRow[] = [];
  for (const [key, items] of byTheme) {
    const people = new Set(items.map((e) => e.speaker)).size;
    if (people < MIN_GROUP_SIZE) continue;
    const candidates = items.filter((e) => e.text.length <= MAX_QUOTE_LENGTH).map((e) => e.text);
    let quotes: string[] = [];
    try {
      const p = await coder.containsPII(candidates);
      quotes = candidates.filter((_, i) => p[i]! < PII_THRESHOLD).slice(0, MAX_QUOTES);
    } catch {
      quotes = []; // fail closed (AI-2): keep the theme label, show no quotes
    }
    out.push({ theme: THEMES[key], participantCount: people, quotes: quotes.map((text) => ({ quoteHash: quoteHash(text), text })) });
  }
  return out.sort((a, b) => b.participantCount - a.participantCount || a.theme.localeCompare(b.theme));
}

/** Keyword stand-in for JEV_MODE=mock or no key. Deterministic. Order matters: first match wins. */
const KEYWORDS: [ThemeKey, RegExp][] = [
  ["booking_confusing", /book|schedul|portal|phone calls|who to call/i],
  ["after_funding", /funding|march|after the pilot|continues|it ends|stops/i],
  ["trust_in_carers", /trust|carer|nervous|stranger/i],
  ["less_guilt", /guilt|anonymous|asking for help|justify|explain myself|easier to ask/i],
  ["time_for_work", /work|meeting|focus|sick days|vacation days|lunch|evenings/i],
];
/** Emails, phone numbers, "manager Dave", and two capitalised words in a row (a full name). */
const PII = /@|\d{3}[-. ]?\d{3}[-. ]?\d{4}|\b(manager|supervisor|boss) [A-Z][a-z]+|\b[A-Z][a-z]+ [A-Z][a-z]{2,}\b/;

export const mockCoder: ThemeCoder = {
  name: "mock",
  async classify(texts) {
    return texts.map((t) => KEYWORDS.find(([, re]) => re.test(t))?.[0] ?? "other");
  },
  async containsPII(texts) {
    return texts.map((t) => (PII.test(t) ? 1 : 0));
  },
};
