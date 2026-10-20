import type { Metadata } from "next";
import { HrOverviewPage } from "@/components/breather/hr-overview";

export const metadata: Metadata = { title: "HR Overview · Breather", description: "Caregiver support pilot overview for HR: enrolment, usage and outcomes." };

export default function Page() {
  return <HrOverviewPage />;
}
