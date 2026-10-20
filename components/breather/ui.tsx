// Shared pieces of the final UI (Vicka, Oct 18; ported from the Lovable export).
import Link from "next/link";
import { CalendarDays, Lock, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { MIN_GROUP_SIZE } from "@/config/public";
import { isSuppressed, type SuppressibleNumber } from "@/lib/contracts";

export function Logo({ compact = false }: { compact?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark, styled by .brand-logo
  return <img className={compact ? "brand-logo brand-logo--compact" : "brand-logo"} src="/brand/se-health-logo" alt="SE Health" />;
}

const WHY = `Hidden to protect privacy: fewer than ${MIN_GROUP_SIZE} people.`;

/** HR-4: a hidden value reads "<5" with a lock and an explanation; never a number from 1–4. */
export function SuppressedValue({ value, format = (n: number) => n.toLocaleString("en-CA"), size = 18 }: { value: SuppressibleNumber | undefined; format?: (n: number) => string; size?: number }) {
  if (value === undefined) return <>—</>;
  // Plain text, so the design's typography on the parent (e.g. .hr-donut-label strong) applies.
  if (!isSuppressed(value)) return <>{format(value)}</>;
  return (
    <span className="suppressed" title={WHY} aria-label={`Fewer than ${MIN_GROUP_SIZE}. ${WHY}`}>
      <Lock size={size} aria-hidden="true" />
      &lt;{MIN_GROUP_SIZE}
    </span>
  );
}

/** A visible number, or null when hidden or missing. */
export const num = (v: SuppressibleNumber | null | undefined): number | null => (v === undefined || v === null || isSuppressed(v) ? null : v);
/** Plain-text form for emails, CSV and PDF: hidden values never become numbers. */
export const text = (v: SuppressibleNumber | null | undefined, format = (n: number) => n.toLocaleString("en-CA")) =>
  v === null || v === undefined ? "—" : isSuppressed(v) ? `<${MIN_GROUP_SIZE}` : format(v);
export const money = (n: number) => `$${Math.round(n).toLocaleString("en-CA")}`;

export function Motif({ kind }: { kind: "heart" | "cross" | "triangle" | "star" }) {
  return <span className={`motif motif--${kind}`} aria-hidden="true" />;
}

export function LoadingState({ label = "Loading synthetic pilot data" }: { label?: string }) {
  return (
    <section className="state-card" aria-live="polite" aria-busy="true">
      <p className="label">{label}</p>
      <div className="skeleton skeleton--title" />
      <div className="skeleton" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
      </div>
    </section>
  );
}

export function ErrorState({ title = "We couldn’t load this view", body = "Your demo choices are safe. Try loading the synthetic data again.", retry }: { title?: string; body?: string; retry?: () => void }) {
  return (
    <section className="state-card state-card--center" role="alert">
      <span className="lock-orb">
        <RefreshCcw size={28} />
      </span>
      <p className="label">Pilot data unavailable</p>
      <h1>{title}</h1>
      <p>{body}</p>
      {retry ? (
        <button className="button button--red" onClick={retry}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

export function EmptyState({ href }: { href: string }) {
  return (
    <section className="state-card state-card--center">
      <span className="lock-orb">
        <CalendarDays size={28} />
      </span>
      <p className="label">Nothing to show yet</p>
      <h1>No pilot activity yet</h1>
      <p>The survey link opens in week 1. Company-wide totals will appear here after people take part.</p>
      <Link className="button button--plum" href={href}>
        View the demo data
      </Link>
    </section>
  );
}

export function Locked({ week, children }: { week: number; children?: ReactNode }) {
  return (
    <div className="locked-state">
      <span className="lock-orb">
        <Lock size={28} />
      </span>
      <h1>Available at pilot end</h1>
      <p>You’re at week {week} of 13. The recommendation opens after the final pilot data is ready.</p>
      <div className="progress-track">
        <span style={{ width: `${(week / 13) * 100}%` }} />
      </div>
      <strong>{Math.round((week / 13) * 100)}% complete</strong>
      {children}
    </div>
  );
}
