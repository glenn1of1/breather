export type Tone = "people" | "info" | "activity" | "positive" | "card" | "page";
export type ShapeKind = "heart" | "crescent" | "star" | "plus" | "blob";
export type TypeStyle = "display" | "headline" | "title" | "body" | "label";

export interface EmployerTheme {
  slug: string;
  name: string;
  fictional?: boolean;
  wordmark?: string;
  /** One accent, used only in the co-brand strip. Must carry accentText at 4.5:1 and must not be red. */
  accent: string;
  accentText: string;
  accentTint: string;
  greeting?: string;
  headcount?: number;
  places?: number;
}

export declare const tokens: {
  colors: Record<
    | "se-red" | "se-red-deep" | "plum" | "teal" | "teal-deep" | "soft-sage" | "page" | "card" | "logo-grey"
    | "text-grey" | "red-tint" | "teal-tint" | "plum-tint" | "white" | "sidebar-active" | "sidebar-label",
    string
  >;
  shapeFills: Record<"people" | "info" | "activity" | "positive" | "card", string>;
  tones: Record<Tone, { background: string; text: string; icon: string; shape: ShapeKind }>;
  chart: { series: [string, string, string, string]; bar: string; barCurrent: string; line: string; well: string };
  font: { family: string; googleFontsUrl: string };
  type: Record<TypeStyle, { fontSize: string; fontWeight: number; lineHeight: number; use: string }>;
  typeFloorPx: 12;
  radius: Record<"sm" | "md" | "lg" | "xl" | "full", string>;
  space: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl", string>;
  targetMinPx: 44;
  iconStroke: number;
  privacy: { minGroupSize: number; hiddenText: string; tooltip: string };
};

export declare const themes: Record<string, EmployerTheme>;

export declare function contrastRatio(a: string, b: string): number;
export declare function meetsAA(foreground: string, background: string, options?: { large?: boolean }): boolean;
/** Returns "<5" when the group is smaller than 5 people, otherwise the value. */
export declare function suppress<T>(value: T, groupSize?: number): T | "<5";
/** Problems with an employer theme; an empty array means it follows the brand rules. */
export declare function checkEmployerTheme(theme: EmployerTheme): string[];
/** CSS custom properties for a style prop. Throws when the theme breaks the brand rules. */
export declare function employerStyle(themeOrSlug: EmployerTheme | string): Record<string, string>;
