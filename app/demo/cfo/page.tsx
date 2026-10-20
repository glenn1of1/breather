import type { Metadata } from "next";
import { CfoPage } from "@/components/breather/cfo";

export const metadata: Metadata = { title: "Pilot Decision · Breather", description: "End-of-pilot recommendation, signals and cost planning range for the CFO." };

export default function Page() {
  return <CfoPage />;
}
