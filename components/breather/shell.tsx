"use client";
// The persistent demo shell (side panel + synthetic-data bar + device frame) and each app's frame.
// DemoShell renders once in app/layout.tsx so it never unmounts between pages.
import { Fragment, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowRight, ClipboardCheck, Home, Mail, Megaphone, Menu, RotateCcw, Sparkles, WalletCards, X } from "lucide-react";
import { PILOT_WEEKS } from "@/config/public";
import type { Scenario } from "@/lib/contracts";
import { useDemo } from "@/components/demo/demo-provider";
import { EmptyState, ErrorState, LoadingState, Logo } from "./ui";

const navGroups = [
  { title: "Pitch", items: [{ to: "/demo/preview", label: "Before you join", icon: Megaphone }] },
  {
    title: "Employee",
    items: [
      { to: "/demo/employee/email", label: "Welcome email", icon: Mail, hint: "Employees open the survey from the link in this email" },
      { to: "/demo/s/demo", label: "Caregiver survey", icon: ClipboardCheck },
    ],
  },
  {
    title: "HR",
    items: [
      { to: "/demo/hr/email", label: "Weekly email", icon: Mail, hint: "HR reaches the dashboard from the link in this email" },
      { to: "/demo/hr", label: "Dashboard", icon: Home },
      { to: "/demo/hr/report", label: "Monthly report", icon: ClipboardCheck },
    ],
  },
  {
    title: "CFO",
    items: [
      { to: "/demo/cfo/email", label: "Final email", icon: Mail, hint: "CFO opens the pilot report from the link in this email" },
      { to: "/demo/cfo", label: "Pilot decision", icon: WalletCards },
    ],
  },
] as const;

function Sidebar({ pathname, close }: { pathname: string; close?: () => void }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="product-mark">
        <div className="logo-tile logo-tile--top">
          <Logo compact />
        </div>
        {close && (
          <button className="icon-button icon-button--light close-menu" onClick={close} aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>
      <p className="sidebar-hint">This is the side panel — use it to navigate the demo.</p>
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const hint = "hint" in item ? item.hint : undefined;
              const active = pathname === item.to;
              return (
                <Fragment key={item.to}>
                  <Link href={item.to} onClick={close} className={`nav-item ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                    {item.label}
                  </Link>
                  {hint && (
                    <p className="sidebar-hint sidebar-hint--flow">
                      <ArrowDown size={14} aria-hidden="true" />
                      {hint}
                    </p>
                  )}
                </Fragment>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

/** usePathname suspends under Cache Components on /s/[token]; the fallback is the same panel without an active item. */
function RoutedSidebar({ close }: { close?: () => void }) {
  return <Sidebar pathname={usePathname()} close={close} />;
}

export function DemoShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return (
    <div className="app">
      <section className="mobile-block" role="alert">
        <Logo compact />
        <h1>Please open on desktop</h1>
        <p>This demo can’t be used on mobile. Open it on a laptop or desktop computer to explore Breather.</p>
      </section>
      <header className="mobile-header">
        <div className="product-mark product-mark--mobile">
          <span aria-hidden="true" />
          <strong>Breather</strong>
        </div>
        <button className="button button--plum" onClick={() => setMenuOpen(true)}>
          <Menu size={19} />
          Menu
        </button>
      </header>
      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} hidden={!menuOpen}>
        <Suspense fallback={<Sidebar pathname="" close={close} />}>
          <RoutedSidebar close={close} />
        </Suspense>
      </div>
      <Suspense fallback={<Sidebar pathname="" />}>
        <RoutedSidebar />
      </Suspense>
      <main className="main" id="main-content">
        <DemoControls />
        <div className="device">
          <div className="device__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="device__screen">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** HR-8 + DEMO-1: synthetic-data banner, week (per viewer), scenario (re-seeds the shared demo DB) and reset. */
function DemoControls() {
  const { week, setWeek, scenario, changeScenario, reset, busy } = useDemo();
  return (
    <section className="demo-controls" aria-label="Pilot demo controls">
      <div className="demo-disclosure">
        <Sparkles size={16} aria-hidden="true" />
        <span>Synthetic data · Breather prototype</span>
      </div>
      <label className="week-slider">
        <span>
          Week {week} of {PILOT_WEEKS}
        </span>
        <input type="range" min={1} max={PILOT_WEEKS} value={week} onChange={(e) => setWeek(Number(e.target.value))} aria-label={`Pilot week ${week} of ${PILOT_WEEKS}`} />
      </label>
      <div className="scenario-tabs" aria-label="Demo scenario" aria-busy={busy}>
        {(["scale", "sustain", "stop"] as Scenario[]).map((item) => (
          <button key={item} className={scenario === item ? "is-selected" : ""} aria-pressed={scenario === item} disabled={busy} onClick={() => changeScenario(item)}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <button className="demo-reset" onClick={reset} disabled={busy} title="Re-seed this scenario, clear live sign-ups and go to week 1">
        <RotateCcw size={15} aria-hidden="true" />
        {busy ? "Loading…" : "Reset"}
      </button>
    </section>
  );
}

export type AppKind = "pitch" | "employee" | "hr" | "cfo";

function AppTopbar({ app, pathname }: { app: AppKind; pathname: string }) {
  const names: Record<AppKind, string> = { pitch: "Caregiver Support", employee: "Caregiver Check-in", hr: "Breather · HR", cfo: "Breather · Finance" };
  const tab = (to: string) => (pathname === to ? "is-active" : "");
  return (
    <header className="app-topbar app-topbar--pitch">
      <Logo compact />
      <span className="app-topbar__name">{names[app]}</span>
      {app === "pitch" && (
        <Link className="app-topbar__cta" href="/demo/hr">
          Employer demo <ArrowRight size={16} />
        </Link>
      )}
      {app === "cfo" && <span className="app-topbar__badge">Pilot decision</span>}
      {app === "hr" && (
        <nav className="app-topbar__tabs" aria-label="HR app">
          <Link href="/demo/hr" className={tab("/demo/hr")} aria-current={pathname === "/demo/hr" ? "page" : undefined}>
            Dashboard
          </Link>
          <Link href="/demo/hr/report" className={tab("/demo/hr/report")} aria-current={pathname === "/demo/hr/report" ? "page" : undefined}>
            Monthly report
          </Link>
        </nav>
      )}
    </header>
  );
}

/** The design's ?ui=loading|empty|error preview states, shown inside the screen. */
function useUiOverride(pathname: string) {
  const state = useSearchParams().get("ui");
  if (state === "loading") return <LoadingState />;
  if (state === "empty") return <EmptyState href={pathname} />;
  if (state === "error") return <ErrorState />;
  return null;
}

function FrameBody({ app, bare, children }: { app: AppKind; bare: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const override = useUiOverride(pathname);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      {!bare && <AppTopbar app={app} pathname={pathname} />}
      <div className="app-window__body" ref={ref}>
        <div className="page-fade" key={pathname}>
          {override ?? children}
        </div>
      </div>
    </>
  );
}

export function AppFrame({ app, bare = false, compact = false, children }: { app: AppKind; bare?: boolean; compact?: boolean; children: ReactNode }) {
  return (
    <div className={`app-window app-window--${app}${bare ? " app-window--mail" : ""}${compact ? " app-window--overview" : ""}`}>
      <Suspense
        fallback={
          <>
            {!bare && <AppTopbar app={app} pathname="" />}
            <div className="app-window__body">
              <div className="page-fade">{children}</div>
            </div>
          </>
        }
      >
        <FrameBody app={app} bare={bare}>
          {children}
        </FrameBody>
      </Suspense>
    </div>
  );
}

const REPLIES = ["Thank you!", "Wonderful, I’ll sign up now.", "Thank you for letting me know."];

export function MailClient({ to, subject, preview, children }: { to: string; subject: string; preview: string; children: ReactNode }) {
  return (
    <div className="mail-app">
      <aside className="mail-rail" aria-hidden="true">
        <span className="mail-compose">
          <Mail size={16} /> Compose
        </span>
        <span className="mail-folder is-active">
          Inbox <b>1</b>
        </span>
        <span className="mail-folder">Starred</span>
        <span className="mail-folder">Sent</span>
        <span className="mail-folder">Drafts</span>
      </aside>
      <section className="mail-list" aria-hidden="true">
        <div className="mail-search">Search mail</div>
        <div className="mail-row is-active">
          <strong>SE Health</strong>
          <span>{subject}</span>
          <small>{preview}</small>
        </div>
        <div className="mail-row">
          <strong>Benefits Team</strong>
          <span>Open enrolment reminder</span>
          <small>Your annual review is coming up…</small>
        </div>
        <div className="mail-row">
          <strong>Payroll</strong>
          <span>Pay statement available</span>
          <small>Your latest statement is ready.</small>
        </div>
      </section>
      <article className="mail-message">
        <h1 className="mail-subject">{subject}</h1>
        <div className="mail-sender">
          <span className="mail-avatar" aria-hidden="true">
            SE
          </span>
          <div>
            <strong>SE Health</strong> <small>&lt;pilot@sehealth.ca&gt;</small>
            <p>to {to}</p>
          </div>
          <time>9:02 AM</time>
        </div>
        <div className="mail-body">
          <Logo compact />
          {children}
          <div className="mail-replies" role="group" aria-label="Suggested replies (decorative)">
            {REPLIES.map((t) => (
              <span key={t} className="mail-reply-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
