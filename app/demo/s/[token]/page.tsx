import type { Metadata } from "next";
import { Suspense } from "react";
import { SurveyPage } from "@/components/breather/survey";
import { SURVEY_QUESTIONS } from "@/config/survey";

export const metadata: Metadata = { title: "Caregiver Check-in · Breather", description: "An anonymous two-minute check for employees who help someone with care." };

// Cache Components: the survey reads the link token (useParams), so it renders inside <Suspense>.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SurveyPage questions={SURVEY_QUESTIONS} />
    </Suspense>
  );
}
