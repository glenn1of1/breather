import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";
import type { EmployerTheme, ShapeKind, Tone } from "./index";

export declare function BrandShape(props: { kind?: ShapeKind; className?: string; fill?: string }): ReactElement;
export declare function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "hero" | "default" | "secondary" }): ReactElement;
export declare function Card(props: HTMLAttributes<HTMLDivElement> & { tone?: Tone; shape?: boolean }): ReactElement;
export declare function StatCard(props: { tone?: Tone; icon?: ReactNode; label: string; value: ReactNode; hint?: string; groupSize?: number }): ReactElement;
export declare function IconChip(props: { tone?: Tone; children: ReactNode }): ReactElement;
export declare function Pill(props: { tone?: Tone; className?: string; children: ReactNode }): ReactElement;
export declare function SectionTag(props: { children: ReactNode }): ReactElement;
export declare function PrivacyValue(props: { className?: string }): ReactElement;
export declare function PageTitle(props: { kicker?: ReactNode; children: ReactNode }): ReactElement;
export declare function SyntheticBanner(props: { children?: ReactNode }): ReactElement;
export declare function EmployerFrame(props: { employer?: string; theme?: EmployerTheme; className?: string; children?: ReactNode }): ReactElement;
