"use client";
// PRD CFO-1..7, AI-1, AI-3, AI-5. Pilot decision (final UI): verdict from /api/verdict (Jev or the
// rules engine), SPI/CPI, cost to continue, "What changed" and the report pack. Every number comes
// from /api/cfo (SEC-3): the sliders send values, the server runs the cost model and the rules.
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { PILOT_WEEKS } from "@/config/public";
import type { CfoView, DashboardSnapshot, Scenario, VerdictResult } from "@/lib/contracts";
import type { Assumptions } from "@/lib/cfo/format";
import { useDemo } from "@/components/demo/demo-provider";
import { VERDICT_COPY, useCfoView, useVerdict } from "./cfo-data";
import { CfoPlanning, CfoReportActions, CfoSignals } from "./cfo-planning";
import { AppFrame } from "./shell";
import { ErrorState, LoadingState, Locked } from "./ui";

export function CfoPage() {
  const { week } = useDemo();
  return <AppFrame app="cfo">{week < PILOT_WEEKS ? <Locked week={week} /> : <Decision />}</AppFrame>;
}

type Edit = { scenario: Scenario; assumptions: Assumptions };

function Decision() {
  const { version, bump } = useDemo();
  // Slider edits apply to the scenario they were made in; a new scenario starts from its defaults.
  const [edit, setEdit] = useState<Edit | null>(null);
  const edits = useMemo(() => (edit ? { [edit.scenario]: edit.assumptions } : {}), [edit]);
  const { view, error: viewError } = useCfoView(version, edits);
  const s13 = view?.months[2] ?? null;
  if (edit && s13 && edit.scenario !== s13.scenario) setEdit(null);
  const { verdict, error } = useVerdict(`${version}:${s13?.scenario ?? ""}`, s13 !== null);

  if (viewError && !view) return <ErrorState title="We couldn’t load the pilot decision" retry={bump} />;
  if (error && !verdict) return <ErrorState title="Recommendation unavailable" body={error} retry={bump} />;
  if (!view || !s13?.pilotEnd || !verdict) return <LoadingState label={view ? "Asking Jev AI for a recommendation" : "Loading the pilot decision"} />;
  // Sliders follow the hand at once; the numbers follow when the server answers.
  const assumptions = edit?.scenario === s13.scenario ? edit.assumptions : view.assumptions;
  return <DecisionView key={s13.scenario} view={view} verdict={verdict} assumptions={assumptions} onChange={(next) => setEdit({ scenario: s13.scenario, assumptions: next })} />;
}

function DecisionView({ view, verdict, assumptions, onChange }: { view: CfoView; verdict: VerdictResult; assumptions: Assumptions; onChange: (a: Assumptions) => void }) {
  return (
    <div className="decision-page">
      <div className="decision-summary-grid">
        <VerdictCard s13={view.months[2]} v={verdict}>
          <CfoReportActions view={view} verdict={verdict} />
        </VerdictCard>
        <CfoSignals view={view} verdict={verdict} />
      </div>
      <CfoPlanning view={view} verdict={verdict} assumptions={assumptions} onChange={onChange} />
    </div>
  );
}

function VerdictCard({ s13, v, children }: { s13: DashboardSnapshot; v: VerdictResult; children: React.ReactNode }) {
  const copy = VERDICT_COPY[v.category];
  // The last reason is the conclusion sentence; the verdict line already says it.
  const reasons = v.reasons.slice(0, -1);
  return (
    <section className="verdict-card">
      <div className="verdict-meta">
        <span>{v.source === "jev" && v.confidence !== null ? `Jev AI confidence ${Math.round(v.confidence * 100)}%` : "Rules engine recommendation"}</span>
        {v.source === "jev" && <span>{v.rulesAgree ? "Rules engine: agrees" : `Rules engine: would say ${VERDICT_COPY[v.rulesCategory].title}`}</span>}
      </div>
      <h1>{copy.title}</h1>
      <p className="verdict-line">{copy.line(s13.pilotEnd!.signals.improvedCount)}</p>
      {v.category === "stop" && (
        <div className="stop-guidance">
          <h2>Reevaluate with HSA</h2>
          <p>Review the pilot with HSA and SE Health before deciding what comes next. Explore why people did not join, whether eligibility and service options matched their needs, and whether booking around work was practical.</p>
          <p>Agree on improvements to communication, access and support, then set clear uptake and outcome goals for a revised pilot. Reassess once enough anonymous feedback and company-wide results are available.</p>
        </div>
      )}
      <ul>
        {reasons.map((r) => (
          <li key={r}>
            <Check size={18} />
            {r}
          </li>
        ))}
      </ul>
      {children}
      <strong>Breather recommends; you decide.</strong>
      <details className="signal-explanation verdict-why">
        <summary>What to tell staff, and what this is and isn’t</summary>
        <p>
          <strong>What to tell staff.</strong> {copy.staff}
        </p>
        <p>
          <strong>What this is.</strong> A recommendation from your own pilot’s company-wide totals, with every input shown below.
        </p>
        <p>
          <strong>What this isn’t.</strong> Proof that respite causes better outcomes, or a prediction of future costs. Three months and a dozen people can’t show that.
        </p>
      </details>
    </section>
  );
}
