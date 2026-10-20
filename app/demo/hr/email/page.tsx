import type { Metadata } from "next";
import { HrEmailPage } from "@/components/breather/emails";

export const metadata: Metadata = { title: "Weekly Email · Breather", description: "The weekly pilot update HR receives from SE Health." };

export default function Page() {
  return <HrEmailPage />;
}
