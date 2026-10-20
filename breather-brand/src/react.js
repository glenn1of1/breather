// Plain React components for the Breather look. No JSX and no build step, so they drop into
// Next.js, Vite or Lovable as they are. Styling comes from css/breather.css (import it once).
import { createElement as h } from "react";
import { tokens } from "./tokens.js";
import { themes } from "./themes.js";
import { employerStyle } from "./index.js";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const SHAPE_PATHS = {
  heart: "M100 178C40 132 10 100 10 64 10 34 34 12 62 12c18 0 30 10 38 24 8-14 20-24 38-24 28 0 52 22 52 52 0 36-30 68-90 114Z",
  crescent: "M120 10a90 90 0 1 0 70 110 70 70 0 1 1-70-110Z",
  star: "M100 8l24 64 68 4-53 42 18 66-57-38-57 38 18-66L8 76l68-4Z",
  plus: "M76 12h48q8 0 8 8v48h48q8 0 8 8v48q0 8-8 8h-48v48q0 8-8 8H76q-8 0-8-8v-48H20q-8 0-8-8V76q0-8 8-8h48V20q0-8 8-8Z",
  blob: "M150 30c32 22 44 70 26 106s-62 56-104 46S6 132 14 92 54 22 88 14s40-6 62 16Z",
};

/** One of the five brand shapes. Always decorative, so always hidden from assistive tech. */
export function BrandShape({ kind = "blob", className, fill }) {
  return h(
    "svg",
    { viewBox: "0 0 200 200", "aria-hidden": "true", focusable: "false", className: cx("br-shape", className) },
    h("path", { d: SHAPE_PATHS[kind], fill: fill ?? "currentColor" }),
  );
}

/** Pill button. variant: "hero" (SE Red, one per view) | "default" (Plum) | "secondary" (outline). */
export function Button({ variant = "default", className, type = "button", ...props }) {
  return h("button", { type, className: cx("br-button", `br-button--${variant}`, className), ...props });
}

/** 24px card in one tone: people | info | activity | positive | card | page. One idea per card. */
export function Card({ tone = "card", shape = true, className, children, ...props }) {
  const kind = tokens.tones[tone]?.shape ?? "blob";
  return h(
    "div",
    { className: cx("br-card", `br-tone--${tone}`, className), ...props },
    shape && h(BrandShape, { kind, className: "br-card__shape" }),
    children,
  );
}

/** Stat card: icon chip + label, then the number as the biggest thing on the card. */
export function StatCard({ tone = "card", icon, label, value, hint, groupSize }) {
  const hidden = groupSize !== undefined && groupSize < tokens.privacy.minGroupSize;
  return h(
    Card,
    { tone },
    h("div", { className: "br-stat__head" }, icon && h(IconChip, { tone }, icon), h("span", { className: "br-label" }, label)),
    hidden ? h(PrivacyValue, { className: "br-display" }) : h("div", { className: "br-display" }, value),
    hint && h("p", { className: "br-body br-stat__hint" }, hint),
  );
}

/** Tinted circle that holds one outline icon (Lucide, strokeWidth 1.8). */
export function IconChip({ tone = "card", children }) {
  return h("span", { className: cx("br-icon-chip", `br-icon-chip--${tone}`) }, children);
}

/** Data pill. Always carries a word, never colour alone. */
export function Pill({ tone = "info", className, children }) {
  return h("span", { className: cx("br-pill", `br-tone--${tone}`, className) }, children);
}

/** Dashed outline section tag. Replaces all-caps eyebrow kickers. */
export function SectionTag({ children }) {
  return h("span", { className: "br-tag" }, children);
}

/** "<5" with a lock, focusable, with the standard privacy explanation. */
export function PrivacyValue({ className }) {
  return h(
    "span",
    { className: cx("br-privacy", className), tabIndex: 0, title: tokens.privacy.tooltip, "aria-label": `${tokens.privacy.hiddenText}. ${tokens.privacy.tooltip}` },
    h(
      "svg",
      { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
      h("rect", { x: 4, y: 11, width: 16, height: 10, rx: 2 }),
      h("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }),
    ),
    tokens.privacy.hiddenText,
  );
}

/** Display title with the 64px SE Red rule under it, as on the SE Health placemat. */
export function PageTitle({ kicker, children }) {
  return h(
    "div",
    { className: "br-page-title" },
    kicker && h("p", { className: "br-kicker" }, kicker),
    h("h1", { className: "br-display" }, children),
    h("span", { className: "br-rule", "aria-hidden": "true" }),
  );
}

/** "Synthetic data" banner every page shows. */
export function SyntheticBanner({ children = "Synthetic data. No real people or employers." }) {
  return h("p", { className: "br-synthetic", role: "note" }, children);
}

/**
 * The employer's own homepage frame: SE Health brand everywhere, the employer's name and accent
 * only in the co-brand strip. <EmployerFrame employer="northwind">…</EmployerFrame>
 */
export function EmployerFrame({ employer, theme, children, className }) {
  const resolved = theme ?? themes[employer];
  if (!resolved) throw new Error(`Unknown employer theme: ${employer}`);
  const style = employerStyle(resolved);
  const name = resolved.name;
  return h(
    "div",
    { className: cx("br-employer", className), "data-employer": resolved.slug, style },
    h("div", { className: "br-employer__strip" }, h("span", { className: "br-employer__mark", "aria-hidden": "true" }), h("span", { className: "br-label" }, name)),
    children,
  );
}
