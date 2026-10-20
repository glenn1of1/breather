import type { Metadata } from "next";
import { CfoEmailPage } from "@/components/breather/emails";

export const metadata: Metadata = { title: "End-of-Pilot Email · Breather", description: "The CFO's final SE Health pilot email with the decision report for CEO review." };

export default function Page() {
  return <CfoEmailPage />;
}
