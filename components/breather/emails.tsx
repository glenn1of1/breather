"use client";
// PRD HR-6 plus the final UI's employee welcome email and CFO end-of-pilot email. Simulated: nothing is sent.
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { PILOT_WEEKS } from "@/config/public";
import { useSnapshot } from "@/lib/client/api";
import { useDemo } from "@/components/demo/demo-provider";
import { firstName, hoursToDate } from "./hr-overview";
import { VERDICT_COPY, useVerdict } from "./cfo-data";
import { AppFrame, MailClient } from "./shell";
import { ErrorState, LoadingState, num, SuppressedValue, text } from "./ui";

/** Design lines for weeks 1–5; from week 6 the line is a real focus-group theme (decision Oct 18). */
const EARLY_THEMES: [string, string][] = [
  ["Getting started", "Most questions were about how to book a first visit."],
  ["Getting started", "People asked how private their answers are."],
  ["Household help", "Meal prep and cleaning were the most requested services."],
  ["Household help", "Household help made up almost half of all visits."],
  ["Time off", "Fewer people said they needed to leave work early."],
];

function headline(week: number) {
  return week <= 2
    ? "Your pilot is off to a good start."
    : week <= 5
      ? "Caregivers are settling into their support."
      : week <= 10
        ? "The pilot is reaching the people it was made for."
        : week < PILOT_WEEKS
          ? "The pilot is in its final weeks."
          : "Your pilot is complete.";
}

export function HrEmailPage() {
  const { week, version, bump } = useDemo();
  const { data: s, error } = useSnapshot(week, version);
  if (!s) return <AppFrame app="hr" bare>{error ? <ErrorState retry={bump} /> : <LoadingState />}</AppFrame>;
  const accepted = num(s.counts.accepted);
  const summary =
    accepted === null
      ? "Places are starting to fill, and people are starting to book visits."
      : accepted < s.counts.places
        ? `${accepted} of ${s.counts.places} places are in use so far, and people are starting to book visits.`
        : `All ${s.counts.places} places are in use, and company-wide outcomes are moving in a positive direction.`;
  const real = s.themes.length ? s.themes[(week - 6) % s.themes.length] : undefined;
  const theme: [string, string] = real ? [real.theme, `${real.theme} was raised by ${text(real.participantCount)} people.`] : (EARLY_THEMES[Math.min(week, 5) - 1] ?? EARLY_THEMES[0]!);
  const name = firstName(s.employerName).toLowerCase();
  return (
    <AppFrame app="hr" bare>
      <MailClient to={`hr@${name}.ca`} subject={`Pilot update · week ${week} of ${PILOT_WEEKS}`} preview={headline(week)}>
        <h2>{headline(week)}</h2>
        <p>{summary}</p>
        {week === PILOT_WEEKS && (
          <div className="email-theme">
            <strong>Your pilot decision is ready for CEO review.</strong>
            <p>We’ve sent your CFO an end-of-pilot email with a link to the full pilot report and Jev AI’s recommendation. Review the findings together and share the decision with your CEO to agree on next steps.</p>
          </div>
        )}
        <div className="progress-track">
          <span style={{ width: `${(week / PILOT_WEEKS) * 100}%` }} />
        </div>
        <div className="email-stats">
          <div>
            <strong>{hoursToDate(s)}</strong>
            <span>care hours used</span>
          </div>
          <div>
            <strong>
              <SuppressedValue value={s.counts.accepted} />
            </strong>
            <span>active caregivers</span>
          </div>
          <div>
            <strong>
              <SuppressedValue value={s.counts.waitlisted} />
            </strong>
            <span>on the waitlist</span>
          </div>
        </div>
        <div className="email-theme">
          <strong>This week’s theme · {theme[0]}</strong>
          <p>{theme[1]}</p>
        </div>
        <Link className="button button--plum" href="/demo/hr">
          Open the dashboard
        </Link>
        <p className="email-foot">Company totals only. Small groups are hidden to protect privacy.</p>
      </MailClient>
    </AppFrame>
  );
}

export function EmployeeEmailPage() {
  const { week, version } = useDemo();
  const { data: s } = useSnapshot(week, version);
  const places = s?.counts.places ?? 12;
  const accepted = s ? num(s.counts.accepted) : null;
  // A hidden accepted count (1–4) must not leak through "places left", so no number is shown then.
  const left = accepted === null ? null : Math.max(0, places - accepted);
  const open = left === null || left > 0;
  const name = s ? firstName(s.employerName).toLowerCase() : "northwind";
  const status = left === null ? "places are still open." : left > 0 ? `${left} of ${places} places still open.` : "all places are in use — you can still join the waitlist.";
  return (
    <AppFrame app="employee" bare>
      <MailClient
        to={`you@${name}.ca`}
        subject={open ? "Your employer has provided you with caregiver support" : "Caregiver support · join the waitlist"}
        preview={open ? (left === null ? "Places are still open this week." : `${left} of ${places} places still open this week.`) : "All places are in use — join the waitlist."}
      >
        <h2>Your employer has provided you with caregiver support.</h2>
        <p>If you help a family member or friend with care, daily tasks or appointments, your employer is offering free, practical support through SE Health — such as household help, companionship and personal care.</p>
        <p>It takes about two minutes to check if you’re eligible. Your answers are private and are never shared with your employer.</p>
        <Link className="button button--plum" href="/demo/s/demo">
          Check if you’re eligible <ArrowRight size={18} />
        </Link>
        <p className="email-foot">
          Week {week} of {PILOT_WEEKS} · {status} Your employer only sees company-wide totals.
        </p>
      </MailClient>
    </AppFrame>
  );
}

export function CfoEmailPage() {
  const { week, version } = useDemo();
  const locked = week < PILOT_WEEKS;
  const { data: s } = useSnapshot(PILOT_WEEKS, version, false);
  const { verdict, error } = useVerdict(`${version}:${s?.scenario ?? ""}`, !locked && s !== null);
  return (
    <AppFrame app="cfo" bare>
      {locked ? (
        <div className="locked-state">
          <Mail size={32} />
          <h1>Final email arrives at pilot end</h1>
          <p>The CFO’s email and pilot decision report will be ready after week 13.</p>
        </div>
      ) : !verdict ? (
        error ? <ErrorState title="Recommendation unavailable" body={error} /> : <LoadingState label="Preparing the end-of-pilot email" />
      ) : (
        <MailClient
          to={`cfo@${s ? firstName(s.employerName).toLowerCase() : "northwind"}.ca`}
          subject="Your pilot report is ready · Decision for CEO review"
          preview="The pilot is complete. Review the findings and recommendation with your CEO."
        >
          <h2>Your pilot is complete. Your decision report is ready.</h2>
          <p>The final report brings together participation, care hours, company-wide outcomes and the financial planning range.</p>
          <div className="email-theme">
            <strong>
              {verdict.source === "jev" ? "Jev AI’s" : "The rules engine’s"} recommendation · {VERDICT_COPY[verdict.category].title}
            </strong>
            <p>{VERDICT_COPY[verdict.category].line(s?.pilotEnd?.signals.improvedCount ?? 0)}</p>
          </div>
          <p>Review the evidence and next steps, then share the pilot decision with your CEO. The recommendation supports your discussion; the final decision stays with you.</p>
          <Link className="button button--plum" href="/demo/cfo">
            Open the pilot report <ArrowRight size={16} />
          </Link>
          <p className="email-foot">Company-wide results only. This is a simulated end-of-pilot email.</p>
        </MailClient>
      )}
    </AppFrame>
  );
}
