// Placeholder survey (PRD SUR-2). Giada's final question set replaces the text here.
// Keep the `id` values and option `value`s stable: the engine and contracts depend on them.
// Server-only (SEC-3): the survey page passes the questions to the client as props.
import "server-only";

export type SurveyQuestion =
  | { id: string; text: string; kind: "yesno"; required: boolean }
  | { id: string; text: string; kind: "choice"; options: { value: string; label: string }[]; required: boolean }
  | { id: string; text: string; kind: "scale7"; lowLabel: string; highLabel: string; required: boolean }
  | { id: string; text: string; kind: "confirm"; required: boolean }
  | { id: string; text: string; kind: "text"; required: boolean; hint?: string };

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  { id: "q1", kind: "yesno", required: true, text: "Do you regularly help a family member, friend or neighbour who needs support because of age, illness or disability?" },
  { id: "q2", kind: "choice", required: true, text: "About how many hours a week do you spend helping?", options: [
    { value: "<5", label: "Under 5" }, { value: "5-19", label: "5 to 19" }, { value: "20+", label: "20 or more" },
  ] },
  { id: "q3", kind: "choice", required: true, text: "How long have you been helping, or expect to keep helping?", options: [
    { value: "<3m", label: "Under 3 months" }, { value: "3m+", label: "3 months or more" },
  ] },
  { id: "q4", kind: "yesno", required: true, text: "Does the person you help live with you?" },
  { id: "q5", kind: "yesno", required: true, text: "Do you help more than one person?" },
  { id: "q6", kind: "scale7", required: true, text: "How much does caregiving affect your work?", lowLabel: "Not at all", highLabel: "A great deal" },
  { id: "q7", kind: "yesno", required: true, text: "Does anyone else regularly share the caregiving with you?" },
  { id: "q9", kind: "choice", required: true, text: "In the past month, about how many days of sick, vacation or unpaid leave did you use for caregiving?", options: [
    { value: "0", label: "None" }, { value: "1-2", label: "1 to 2" }, { value: "3-5", label: "3 to 5" }, { value: "6+", label: "6 or more" },
  ] },
  { id: "q10", kind: "scale7", required: true, text: "How likely are you to still be working here in a year?", lowLabel: "Very unlikely", highLabel: "Very likely" },
  { id: "q11", kind: "scale7", required: true, text: "How satisfied are you with the support you have for balancing work and care?", lowLabel: "Not satisfied", highLabel: "Very satisfied" },
  { id: "q8", kind: "confirm", required: false, text: "I confirm my answers are true, and SE Health may contact me to arrange support." },
  { id: "q12", kind: "text", required: false, text: "Optional: a phone number or email so SE Health can reach you.", hint: "Only SE Health sees this. Your employer never does." },
];
