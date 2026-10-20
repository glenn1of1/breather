// Live Jev via @typesafe-ai/sdk. Jev returns labels and probabilities, never free text.
// The client is created lazily: constructing it with no TYPESAFE_API_KEY throws, and that must
// happen inside the caller's fallback, never at import time (H6).
import "server-only";
import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { JevClient } from "./client";

let client: TypeSafeClient | undefined;
const getClient = () => (client ??= new TypeSafeClient());

/** Describe each input in words; the rules thresholds are context, not the decision. */
function describe(s: Parameters<JevClient["judgeVerdict"]>[0]) {
  const v = (x: unknown) => (typeof x === "number" ? x : "fewer than 5 people (hidden for privacy)");
  return {
    pilot: "One employer's 3-month caregiver-respite pilot. Synthetic data.",
    outcomeMeasuresImproved: `${s.improvedCount} of 4 (work impact, leave days used for caregiving, intent to stay, satisfaction)`,
    shareOfFundedPlacesUsed: v(s.uptake),
    eligiblePeopleWaitingForAPlace: v(s.waitlist),
    peopleWhoNearlyQualified: v(s.cameClose),
  };
}

export const liveJev: JevClient = {
  name: "jev",
  async judgeVerdict(signals, signal) {
    const { answers } = await getClient().systemOne(
      {
        state: describe(signals),
        questions: {
          category: choice("Should this employer scale, sustain or stop the caregiver-respite benefit after the pilot?", {
            scale: "The pilot shows value for caregivers and more eligible people want it than there are funded places.",
            sustain: "The pilot shows value for caregivers and the current funded places meet demand.",
            stop: "The pilot does not show enough value for caregivers to justify continuing as designed.",
          }),
          valueShown: noul("Do the outcome measures and how much the places were used show meaningful value for caregivers?"),
          demandExceedsPlaces: noul("Does demand clearly exceed the funded places?"),
        },
      },
      { signal, retry: { maxRetries: 0 } },
    );
    return {
      category: answers.category.choice,
      confidence: answers.category.confidence,
      subJudgments: { valueShown: answers.valueShown.noul, demandExceedsPlaces: answers.demandExceedsPlaces.noul },
    };
  },
  async containsPII(quotes, signal) {
    if (!quotes.length) return [];
    // One call, one question per quote; each question names its quote so answers are per quote.
    const questions = Object.fromEntries(
      quotes.map((_, i) => [`q${i}`, noul(`Does quote q${i} contain a name, contact detail, job title, team, place or anything else that could identify a person?`)]),
    );
    const { answers } = await getClient().systemOne(
      { state: { quotes: Object.fromEntries(quotes.map((q, i) => [`q${i}`, q])) }, questions },
      { signal, retry: { maxRetries: 0 } },
    );
    return quotes.map((_, i) => (answers[`q${i}`] as { noul: number }).noul);
  },
};
