"use client";
// PRD PRE-1, PRE-2. "Before you join" (final UI) on the SAME costToContinue() as the CFO view. The
// numbers come from the server (SEC-3): the page renders the defaults, the sliders call /api/preview.
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PREVIEW_START } from "@/config/public";
import type { PreviewResult } from "@/lib/contracts";
import { getPreview, SLIDER_DEBOUNCE_MS } from "@/lib/client/api";
import type { PreviewAssumptionText } from "@/lib/engine/preview";
import { AppFrame } from "./shell";
import { money, Motif } from "./ui";

/** `initial` is the server's estimate for PREVIEW_START, so the first paint needs no request. */
export function PreviewPage({ initial, assumptions }: { initial: PreviewResult; assumptions: PreviewAssumptionText }) {
  const [headcount, setHeadcount] = useState<number>(PREVIEW_START.headcount);
  const [share, setShare] = useState<number>(PREVIEW_START.sharePct);
  const [places, setPlaces] = useState<number>(PREVIEW_START.places);
  const key = `${headcount}|${share}|${places}`;
  const [result, setResult] = useState({ key: `${PREVIEW_START.headcount}|${PREVIEW_START.sharePct}|${PREVIEW_START.places}`, value: initial });
  useEffect(() => {
    if (result.key === key) return;
    const c = new AbortController();
    const t = setTimeout(() => {
      getPreview({ headcount, sharePct: share, places }, c.signal).then((value) => setResult({ key, value }), () => undefined); // keep the last numbers on failure
    }, SLIDER_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [key, result.key, headcount, share, places]);
  const { low: caregiversLow, high: caregiversHigh } = result.value.potentialCaregivers;
  const cost = result.value.costToContinue;
  const demand = result.value.highDemand;
  return (
    <AppFrame app="pitch">
      <div className="preview-page">
        <header className="preview-hero">
          <h1>What could caregiver support cost you?</h1>
          <p>Explore a simple, transparent planning range for your workplace.</p>
        </header>
        <div className="preview-layout">
          <section className="preview-inputs">
            <h2>Try your numbers</h2>
            <label>
              <span>
                <strong>Headcount</strong>
                <b>{headcount} people</b>
              </span>
              <input type="range" min="25" max="500" value={headcount} onChange={(e) => setHeadcount(Number(e.target.value))} />
            </label>
            <label>
              <span>
                <strong>Caregiver share</strong>
                <b>{share}%</b>
              </span>
              <input type="range" min="30" max="35" step="0.5" value={share} onChange={(e) => setShare(Number(e.target.value))} />
            </label>
            <label>
              <span>
                <strong>Pilot places</strong>
                <b>{places}</b>
              </span>
              <input type="range" min="10" max="15" value={places} onChange={(e) => setPlaces(Number(e.target.value))} />
            </label>
            <div className="source-note">
              <ShieldCheck size={19} />
              <p>
                <strong>Assumption</strong>
                <br />
                Caregiver share is illustrative. Confirm national and Ontario sources before external use. Costs assume ${assumptions.rate}/hour, about {assumptions.hours} hours per person per month, {assumptions.uptakePct}% of places used and a {assumptions.adminPct}% admin fee.
              </p>
            </div>
          </section>
          <section className="preview-results">
            <article className="stat-card card--red">
              <p>Estimated caregivers</p>
              <strong>
                {caregiversLow}–{caregiversHigh}
              </strong>
              <span>people in your workforce</span>
              <Motif kind="heart" />
            </article>
            <article className="stat-card card--sage">
              <p>Three-month pilot</p>
              <strong>$0</strong>
              <span>Grant-funded by the Petro-Canada CareMakers Foundation</span>
              <Motif kind="star" />
            </article>
            <article className="stat-card card--neutral">
              <p>Cost to continue</p>
              <strong>
                {money(cost.annual.low)}–{money(cost.annual.high)}
              </strong>
              <span>per year · base {money(cost.annual.base)}</span>
              <Motif kind="triangle" />
            </article>
            <article className="stat-card card--neutral">
              <p>High demand</p>
              <strong>{money(demand.annual.base)}</strong>
              <span>per year if everyone joins</span>
              <Motif kind="cross" />
            </article>
          </section>
        </div>
        <section className="preview-cta">
          <div>
            <p className="label">Funded activity ends March 31, 2027</p>
            <h2>Start the conversation</h2>
            <p>Reach out to SE Health to bring caregiver support to your team.</p>
          </div>
          <a className="button button--red" href="https://sehc.com/contact-us" target="_blank" rel="noopener noreferrer">
            Talk to SE Health about joining <ArrowRight size={18} />
          </a>
        </section>
      </div>
    </AppFrame>
  );
}
