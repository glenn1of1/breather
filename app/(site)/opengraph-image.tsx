import { ImageResponse } from "next/og";
import { showcase } from "@/content/showcase";

// SHOW-3: the link preview for email, LinkedIn and chat apps, generated at build time from the
// content file in Vicka's palette. TODO: swap for a designed image or a screenshot if you prefer
// (delete this file and add app/(site)/opengraph-image.png, 1200 × 630).
export const alt = showcase.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const { hero } = showcase;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#fbf4e6", color: "#121212", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", right: -90, top: -90, width: 420, height: 420, background: "#f5b8db", borderRadius: "210px 210px 40px 210px", transform: "rotate(45deg)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 22, height: 38, background: "#e99ac8", borderRadius: "999px 0 999px 0", transform: "rotate(20deg)", display: "flex" }} />
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{hero.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: 900 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Run a caregiver-benefit pilot, then decide: scale, sustain or stop.</div>
          <div style={{ fontSize: 28, color: "#4b463f" }}>Built for SE Health’s Respite for All challenge</div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", borderRadius: 999, background: "#121212", color: "#fbf4e6", padding: "14px 28px", fontSize: 30, fontWeight: 700 }}>{hero.badge}</div>
        </div>
      </div>
    ),
    size,
  );
}
