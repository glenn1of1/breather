"use client";
// PRD HR-1..4, HR-8. HR dashboard (final UI): totals band, participation donut, weekly hours
// (totals only: a per-week, per-service split would cover fewer than 5 people) and outcomes vs
// baseline behind an "Hours / Outcomes" switch (HR-3, decision Oct 18).
import { useRef, useState } from "react";
import { BarChart3, CalendarDays, Lock, X } from "lucide-react";
import { MEASURE_LABELS } from "@/config/copy";
import { PILOT_WEEKS } from "@/config/public";
import { isSuppressed, type DashboardSnapshot, type MeasureKey, type SuppressibleNumber } from "@/lib/contracts";
import { useSnapshot } from "@/lib/client/api";
import { useDemo } from "@/components/demo/demo-provider";
import { AppFrame } from "./shell";
import { ErrorState, LoadingState, num, SuppressedValue, text } from "./ui";

export const careServices = [
  { key: "household", label: "Household help", tone: "household" },
  { key: "companionship", label: "Companionship", tone: "companionship" },
  { key: "personal_care", label: "Personal care", tone: "personal" },
  { key: "other", label: "Other", tone: "other" },
] as const;

/** Care hours to date: the sum of every visible week (a hidden week had fewer than 5 users). */
export function hoursToDate(s: DashboardSnapshot) {
  return Math.round(s.usage.weekly.reduce((t, w) => t + (num(w.hours) ?? 0), 0) * 10) / 10;
}
export const firstName = (employerName: string) => employerName.replace(" (fictional)", "").split(" ")[0] ?? employerName;

export function HrOverviewPage() {
  const { week, version, bump } = useDemo();
  const { data, error } = useSnapshot(week, version);
  return (
    <AppFrame app="hr" compact>
      {data ? <Overview s={data} /> : error ? <ErrorState retry={bump} /> : <LoadingState />}
    </AppFrame>
  );
}

function Overview({ s }: { s: DashboardSnapshot }) {
  const c = s.counts;
  const accepted = num(c.accepted);
  const full = accepted === c.places;
  return (
    <div className="dashboard-page hr-overview">
      <header className="page-intro dashboard-intro">
        <div>
          <h1>Good morning, {firstName(s.employerName)}</h1>
          <p>Your caregiver support pilot, at a glance.</p>
        </div>
        <span className="hr-current-week">
          <CalendarDays size={17} aria-hidden="true" />
          Week {s.week} of {PILOT_WEEKS}
        </span>
      </header>
      <section className="hr-glance" aria-labelledby="hr-glance-title">
        <h2 id="hr-glance-title">Participation at a glance</h2>
        <dl>
          <div>
            <dt>Potential caregivers</dt>
            <dd>
              <SuppressedValue value={c.potentialCaregivers} />
            </dd>
          </div>
          <div>
            <dt>Active caregivers</dt>
            <dd>
              <SuppressedValue value={c.accepted} />
            </dd>
          </div>
          <div>
            <dt>Care hours used</dt>
            <dd>
              {hoursToDate(s)}
              <small>h</small>
            </dd>
          </div>
          <div>
            <dt>On the waitlist</dt>
            <dd>
              <SuppressedValue value={c.waitlisted} />
            </dd>
          </div>
          <div>
            <dt>Came close</dt>
            <dd>
              <SuppressedValue value={c.cameClose} />
            </dd>
          </div>
        </dl>
      </section>
      <div className="hr-overview-charts">
        <section className="hr-participation-card">
          <div className="card-heading">
            <h2>Pilot participation</h2>
            <strong className="metric-badge">{full ? "At capacity" : `${text(c.accepted)} of ${c.places} places`}</strong>
          </div>
          <ParticipationChart s={s} />
          <p className="hr-capacity-note">{full ? "Every pilot place is in use." : "Caregivers are joining the pilot."}</p>
        </section>
        <HoursAndOutcomes s={s} />
      </div>
      <p className="aggregate-note hr-overview-footer">
        <Lock size={14} aria-hidden="true" />
        Company-wide totals only. Small groups are hidden to protect privacy.
      </p>
    </div>
  );
}

function ParticipationChart({ s }: { s: DashboardSnapshot }) {
  const c = s.counts;
  const parts = [
    { label: "have a place", value: c.accepted, tone: "active" },
    { label: "on the waitlist", value: c.waitlisted, tone: "waitlist" },
    { label: "waiting for window close", value: c.pending, tone: "waiting" },
    { label: "came close", value: c.cameClose, tone: "close" },
  ];
  // Hidden parts are left out of the ring: drawing them would reveal their size.
  const total = parts.reduce((t, p) => t + (num(p.value) ?? 0), 0);
  let offset = 0;
  const label = `${text(c.potentialCaregivers)} potential caregivers: ${text(c.accepted)} have a place, ${text(c.waitlisted)} on the waitlist, ${text(c.pending)} waiting for window close, ${text(c.cameClose)} came close`;
  return (
    <div className="hr-participation">
      <div className="hr-donut">
        <svg viewBox="0 0 120 120" role="img" aria-label={label}>
          <circle className="hr-donut-track" cx="60" cy="60" r="46" fill="none" strokeWidth="14" />
          {parts.map((part) => {
            const v = num(part.value) ?? 0;
            if (!v || !total) return null;
            const length = (v / total) * 100;
            const start = offset;
            offset += length;
            const dash = Math.max(0, length - 1.4);
            return (
              <circle
                key={part.tone}
                className={`hr-donut-segment hr-tone--${part.tone}`}
                cx="60"
                cy="60"
                r="46"
                fill="none"
                strokeWidth="14"
                pathLength="100"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={-start}
                transform="rotate(-90 60 60)"
              />
            );
          })}
        </svg>
        <div className="hr-donut-label">
          <strong>
            <SuppressedValue value={c.potentialCaregivers} />
          </strong>
          <span>potential caregivers</span>
        </div>
      </div>
      <div className="hr-participation-legend">
        {parts.map((part) => (
          <div key={part.tone}>
            <i className={`hr-tone--${part.tone}`} />
            <strong>
              <SuppressedValue value={part.value} size={14} />
            </strong>
            <span>{part.label}</span>
          </div>
        ))}
        <details>
          <summary>Why some numbers show &lt;5</summary>
          <p>Small groups are hidden to protect privacy. Company totals never identify individual employees.</p>
        </details>
      </div>
    </div>
  );
}

function HoursAndOutcomes({ s }: { s: DashboardSnapshot }) {
  const [view, setView] = useState<"hours" | "outcomes">("hours");
  const breakdown = useRef<HTMLDialogElement>(null);
  const total = hoursToDate(s);
  const weeks = Array.from({ length: PILOT_WEEKS }, (_, i) => {
    const w = s.usage.weekly[i];
    return { week: i + 1, hours: w ? w.hours : null };
  });
  const maximum = Math.max(1, ...weeks.map((w) => num(w.hours) ?? 0));
  return (
    <section className="hr-hours-card">
      <div className="card-heading">
        <h2>{view === "hours" ? "Hours used each week" : "Outcomes vs baseline"}</h2>
        <div className="segment-control hr-view-switch" role="group" aria-label="Panel view">
          {(["hours", "outcomes"] as const).map((v) => (
            <button key={v} className={view === v ? "is-selected" : ""} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "hours" ? "Hours" : "Outcomes"}
            </button>
          ))}
        </div>
      </div>
      {view === "outcomes" ? (
        <Outcomes s={s} />
      ) : (
        <>
          <div className="hr-chart-scale">
            <span>Care hours · {total} total</span>
            <span>{maximum} h</span>
          </div>
          <div className="hr-stacked-chart" role="group" aria-label={`Weekly care hours through week ${s.week}, ${total} hours total`}>
            {weeks.map((row) => {
              const future = row.hours === null;
              const hidden = row.hours !== null && isSuppressed(row.hours);
              const h = num(row.hours);
              const label = future ? `Week ${row.week}: upcoming` : hidden ? `Week ${row.week}: hidden, fewer than 5 people used care` : `Week ${row.week}: ${h} hours`;
              return (
                <div role="img" className={`hr-week-column${future ? " is-future" : ""}${hidden ? " is-hidden" : ""}`} key={row.week} tabIndex={future ? undefined : 0} aria-label={label}>
                  <div className="hr-week-stack" style={{ height: `${h !== null ? (h / maximum) * 100 : 8}%` }}>
                    {h !== null && <span className="hr-service--household" style={{ height: "100%" }} />}
                  </div>
                  {!future && (
                    <div className="hr-week-tooltip">
                      <strong>
                        Week {row.week} · {hidden ? "<5 people" : `${h} h`}
                      </strong>
                      {hidden && <span>Hidden to protect privacy</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="hr-week-labels">
            <span>Week 1</span>
            <span>Week 13</span>
          </div>
          <ServiceMix s={s} />
          <button className="button hr-breakdown-button" onClick={() => breakdown.current?.showModal()}>
            <BarChart3 size={15} />
            View weekly breakdown
          </button>
          <dialog className="hr-breakdown-dialog" ref={breakdown} aria-labelledby="hr-breakdown-title">
            <div className="card-heading">
              <h2 id="hr-breakdown-title">Weekly care hours</h2>
              <button className="icon-button" aria-label="Close weekly breakdown" onClick={() => breakdown.current?.close()}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="chart-table-wrap">
              <table className="chart-table">
                <thead>
                  <tr>
                    <th scope="col">Week</th>
                    <th scope="col">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {s.usage.weekly.map((w) => (
                    <tr key={w.week}>
                      <th scope="row">{w.week}</th>
                      <td>{text(w.hours, (n) => `${n} h`)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Service mix to date</th>
                    <td>{careServices.map((sv) => `${sv.label} ${text(s.usage.mix.find((m) => m.service === sv.key)?.share, (n) => `${Math.round(n * 100)}%`)}`).join(" · ")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </dialog>
        </>
      )}
    </section>
  );
}

/** Overall service mix to date, once (HR-2). Each share is hidden unless 5+ people used that service. */
function ServiceMix({ s }: { s: DashboardSnapshot }) {
  const share = (key: string) => s.usage.mix.find((m) => m.service === key)?.share;
  return (
    <>
      <div className="hr-mix-bar" role="img" aria-label={`Service mix to date: ${careServices.map((sv) => `${sv.label} ${text(share(sv.key), (n) => `${Math.round(n * 100)}%`)}`).join(", ")}`}>
        {careServices.map((sv) => {
          const v = num(share(sv.key));
          return v ? <span key={sv.key} className={`hr-service--${sv.tone}`} style={{ width: `${v * 100}%` }} /> : null;
        })}
      </div>
      <div className="hr-service-legend">
        {careServices.map((sv) => (
          <span key={sv.key}>
            <i className={`hr-service--${sv.tone}`} />
            {sv.label} <SuppressedValue value={share(sv.key)} format={(n) => `${Math.round(n * 100)}%`} size={11} />
          </span>
        ))}
      </div>
    </>
  );
}

const SHORT: Record<MeasureKey, { label: string; better: "lower" | "higher" }> = {
  work_impact: { label: "Caregiving impact on work", better: "lower" },
  leave_days: { label: "Caregiving leave days", better: "lower" },
  intent_stay: { label: "Likely to stay in a year", better: "higher" },
  satisfaction: { label: "Satisfied with support", better: "higher" },
};

/** HR-3: each measure's latest company-wide mean against its baseline (hidden under 5 people). */
function Outcomes({ s }: { s: DashboardSnapshot }) {
  const rows = (Object.keys(MEASURE_LABELS) as MeasureKey[]).map((k) => {
    const t = s.trends[k];
    const latest = [...t.points].reverse().find((p) => !isSuppressed(p.mean));
    return { k, baseline: t.baseline, latest: (latest?.mean ?? { suppressed: true }) as SuppressibleNumber, at: latest?.week };
  });
  const any = rows.some((r) => r.at !== undefined);
  return (
    <>
      <div className="chart-table-wrap hr-outcomes">
        <table className="chart-table">
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Baseline</th>
              <th scope="col">Latest check-in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const b = num(r.baseline), l = num(r.latest);
              const dir = b !== null && l !== null && l !== b ? ((l < b) === (SHORT[r.k].better === "lower") ? "better" : "worse") : null;
              return (
                <tr key={r.k}>
                  <th scope="row">
                    {SHORT[r.k].label}
                    <small>{SHORT[r.k].better === "lower" ? "lower is better" : "higher is better"}</small>
                  </th>
                  <td>
                    <SuppressedValue value={r.baseline} format={(n) => n.toFixed(1)} size={13} />
                  </td>
                  <td>
                    <SuppressedValue value={r.latest} format={(n) => n.toFixed(1)} size={13} />
                    {r.at !== undefined && <small> · week {r.at}</small>}
                    {dir && <b className={`hr-outcome-dir is-${dir}`}>{dir === "better" ? " ▲ better" : " ▼ worse"}</b>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hr-capacity-note">{any ? "Check-ins at weeks 4, 8 and 13. Company-wide means only." : "The first check-in is at week 4. Results show once 5 or more people have answered."}</p>
    </>
  );
}
