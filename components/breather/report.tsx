"use client";
// PRD HR-5, HR-7 (submit cut, Oct 18). Monthly report (final UI) from each month's closing snapshot;
// focus-group themes are shown only when 5+ people raised them (quotes screened before storage).
import { useState } from "react";
import { BarChart3, Heart, Lock, MessageCircle, ShieldCheck } from "lucide-react";
import { isSuppressed, type DashboardSnapshot } from "@/lib/contracts";
import { useSnapshot } from "@/lib/client/api";
import { useDemo } from "@/components/demo/demo-provider";
import { careServices } from "./hr-overview";
import { AppFrame } from "./shell";
import { ErrorState, LoadingState, money, num, SuppressedValue } from "./ui";

/** Last pilot week of each reporting month (matches MONTH_WEEKS in lib/aggregate/build-snapshots.ts). */
export const MONTH_END = { 1: 4, 2: 9, 3: 13 } as const;
const monthOf = (week: number): 1 | 2 | 3 => (week <= MONTH_END[1] ? 1 : week <= MONTH_END[2] ? 2 : 3);

export function ReportPage() {
  const { week, version, bump } = useDemo();
  const [picked, setMonth] = useState<1 | 2 | 3 | null>(null);
  const month = picked ?? monthOf(week);
  const unlockWeek = MONTH_END[month];
  const unlocked = week >= unlockWeek;
  const { data, error } = useSnapshot(unlocked ? unlockWeek : 1, version, false);
  return (
    <AppFrame app="hr">
      <div className="content-page">
        <header className="page-intro page-intro--row">
          <div>
            <h1>Month {month} at a glance</h1>
            <p>Aggregate pilot activity from SE Health.</p>
          </div>
          <div className="month-tabs">
            {([1, 2, 3] as const).map((item) => (
              <button className={month === item ? "is-selected" : ""} aria-pressed={month === item} onClick={() => setMonth(item)} key={item}>
                Month {item}
              </button>
            ))}
          </div>
        </header>
        {!unlocked ? (
          <div className="locked-state compact">
            <Lock size={28} />
            <h2>Available after week {unlockWeek}</h2>
            <p>You’re at week {week} of 13.</p>
          </div>
        ) : data?.week === unlockWeek && data.report ? (
          <Report s={data} month={month} />
        ) : error ? (
          <ErrorState retry={bump} />
        ) : (
          <LoadingState />
        )}
      </div>
    </AppFrame>
  );
}

function Report({ s, month }: { s: DashboardSnapshot; month: 1 | 2 | 3 }) {
  const r = s.report!;
  const from = month === 1 ? 1 : MONTH_END[(month - 1) as 1 | 2] + 1;
  // Month total from the weekly totals (a week is hidden only when fewer than 5 people used care).
  const total = Math.round(s.usage.weekly.filter((w) => w.week >= from).reduce((t, w) => t + (num(w.hours) ?? 0), 0) * 10) / 10;
  const used = num(r.fundsUsed);
  return (
    <div className="report-layout">
      <section className="section-card report-card">
        <div className="section-heading">
          <div>
            <p className="label">{total} hours total</p>
            <h2>How support was used</h2>
          </div>
          <BarChart3 size={23} />
        </div>
        <div className="service-rows">
          {careServices.map((sv) => {
            const h = r.hoursByService.find((x) => x.service === sv.key)?.hours;
            const v = num(h);
            return (
              <div key={sv.key}>
                <p>
                  <strong>{sv.label}</strong>
                  <b>
                    <SuppressedValue value={h} format={(n) => `${n} hrs`} size={14} />
                  </b>
                </p>
                <span>
                  <i style={{ width: `${v !== null && total > 0 ? Math.min(100, (v / total) * 100) : 0}%` }} />
                </span>
              </div>
            );
          })}
        </div>
        <div className="report-stats">
          <div>
            <span>Active caregivers</span>
            <strong>
              <SuppressedValue value={r.activeCaregivers} />
            </strong>
          </div>
          <div>
            <span>Funds used</span>
            <strong>
              <SuppressedValue value={r.fundsUsed} format={money} />
            </strong>
            <small>of {money(r.fundsCap)} cap</small>
          </div>
        </div>
        <div className="progress-track">
          <span style={{ width: `${used !== null ? Math.min(100, (used / r.fundsCap) * 100) : 0}%` }} />
        </div>
        <p className="report-privacy">
          <ShieldCheck size={19} aria-hidden="true" />
          Company totals only. No individual answers are included.
        </p>
      </section>
      <Themes s={s} />
    </div>
  );
}

function Themes({ s }: { s: DashboardSnapshot }) {
  const themes = s.themes;
  const lead = themes.find((t) => t.quotes.length > 0);
  return (
    <section className="section-card">
      <p className="label">Focus-group themes</p>
      <h2>What people raised</h2>
      <div className="theme-list">
        {themes.length === 0 ? (
          <div className="is-hidden">
            <Lock size={19} />
            <strong>No themes yet</strong>
            <span>focus groups start in week 6</span>
          </div>
        ) : (
          themes.map((t, i) => (
            <div key={t.theme}>
              {i % 2 === 0 ? <MessageCircle size={19} /> : <Heart size={19} />}
              <strong>{t.theme}</strong>
              <span>{isSuppressed(t.participantCount) ? "fewer than 5" : `${t.participantCount} people`}</span>
            </div>
          ))
        )}
      </div>
      {lead && (
        <div className="theme-detail">
          <span className="status-pill">Privacy check: passed</span>
          <blockquote>“{lead.quotes[0]!.text}”</blockquote>
          <p>Raised by {isSuppressed(lead.participantCount) ? "fewer than 5" : lead.participantCount} people · identifying details removed</p>
        </div>
      )}
    </section>
  );
}
