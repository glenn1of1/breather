import type { Metadata } from "next";
import { EmployeeEmailPage } from "@/components/breather/emails";

export const metadata: Metadata = { title: "Welcome Email · Breather", description: "The email employees receive with the caregiver support survey link." };

export default function Page() {
  return <EmployeeEmailPage />;
}
