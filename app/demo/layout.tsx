import type { Metadata } from "next";
import "../globals.css";
import "../breather.css";
import { DemoProvider } from "@/components/demo/demo-provider";
import { DemoShell } from "@/components/breather/shell";

// SHOW-2, SEC-1: the live demo. proxy.ts lets only holders of a valid access cookie reach it.
export const metadata: Metadata = {
  title: "Breather · Live demo",
  description: "Run SE Health's caregiver-benefit pilot, then decide whether to scale, sustain or stop.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <DemoProvider>
      <DemoShell>{children}</DemoShell>
    </DemoProvider>
  );
}
