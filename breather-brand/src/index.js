import { tokens } from "./tokens.js";
import { themes } from "./themes.js";

export { tokens, themes };

/** WCAG 2.1 relative luminance of a #RRGGBB colour. */
function luminance(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two #RRGGBB colours, 1 to 21. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** True when the pair passes WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text (24px, or 18.66px bold). */
export function meetsAA(foreground, background, { large = false } = {}) {
  return contrastRatio(foreground, background) >= (large ? 3 : 4.5);
}

/**
 * Privacy rule: any value from fewer than 5 people is hidden.
 * Returns the number to show, or "<5" when it must stay hidden.
 */
export function suppress(value, groupSize = value) {
  return groupSize < tokens.privacy.minGroupSize ? tokens.privacy.hiddenText : value;
}

/**
 * Checks an employer co-brand against the guardrails and returns the problems (empty = OK).
 * An employer may bring a name, a wordmark and one accent. The accent must carry white text,
 * must be readable on the page, and must not be red, so SE Red stays the only hero colour.
 */
export function checkEmployerTheme(theme) {
  const problems = [];
  const hex = /^#[0-9a-f]{6}$/i;
  for (const key of ["accent", "accentText", "accentTint"]) {
    if (!hex.test(theme[key] ?? "")) problems.push(`${key} must be a #RRGGBB colour.`);
  }
  if (problems.length) return problems;
  if (!meetsAA(theme.accentText, theme.accent)) problems.push(`accentText on accent is ${contrastRatio(theme.accentText, theme.accent).toFixed(2)}:1; it needs 4.5:1.`);
  if (!meetsAA(theme.accent, tokens.colors.page)) problems.push(`accent on the page background is ${contrastRatio(theme.accent, tokens.colors.page).toFixed(2)}:1; it needs 4.5:1.`);
  if (!meetsAA(tokens.colors.plum, theme.accentTint)) problems.push("Plum text on accentTint must reach 4.5:1.");
  const n = theme.accent.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  if (r > 150 && r > g * 1.6 && r > b * 1.6) problems.push("accent reads as red and would compete with SE Red; pick another hue.");
  if (!theme.name) problems.push("name is required.");
  return problems;
}

/**
 * CSS custom properties for an employer's co-brand layer, ready for a style prop:
 * <div data-employer="northwind" style={employerStyle("northwind")}>
 */
export function employerStyle(themeOrSlug) {
  const theme = typeof themeOrSlug === "string" ? themes[themeOrSlug] : themeOrSlug;
  if (!theme) throw new Error(`Unknown employer theme: ${themeOrSlug}`);
  const problems = checkEmployerTheme(theme);
  if (problems.length) throw new Error(`Employer theme "${theme.name ?? "?"}" breaks the brand rules:\n- ${problems.join("\n- ")}`);
  return {
    "--br-employer-accent": theme.accent,
    "--br-employer-accent-text": theme.accentText,
    "--br-employer-tint": theme.accentTint,
  };
}
