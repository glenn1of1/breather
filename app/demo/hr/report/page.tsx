import type { Metadata } from "next";
import { ReportPage } from "@/components/breather/report";

export const metadata: Metadata = { title: "Monthly Report · Breather", description: "Monthly caregiver support pilot report: hours by service, funds used and focus-group themes." };

export default function Page() {
  return <ReportPage />;
}
