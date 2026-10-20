"use client";
// CFO sections of the final UI: SPI/CPI signals, the planning range, "What changed", the reasoning and
// the export actions. All numbers come from /api/cfo (real snapshots + the shared cost engine, SEC-3).
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Download, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CfoView, VerdictResult } from "@/lib/contracts";
import { graphsCsv, inputsCsv, projectionCsv, show, type Assumptions } from "@/lib/cfo/format";
import { buildReportPack, downloadBlob, graphImageUrl } from "@/lib/cfo/export";
import { money } from "./ui";

const fields: { key: keyof Assumptions; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "rate", label: "Provider rate", min: 20, max: 120, step: 1, unit: "$/h" },
  { key: "hours", label: "Hours per caregiver", min: 1, max: 30, step: 0.5, unit: "h/month" },
  { key: "places", label: "Places", min: 5, max: 100, step: 1, unit: "places" },
  { key: "uptake", label: "Uptake", min: 10, max: 100, step: 1, unit: "%" },
  { key: "admin", label: "Admin fee", min: 0, max: 30, step: 1, unit: "%" },
];
const csv = (content: string, name: string) => downloadBlob(new Blob([content], { type: "text/csv;charset=utf-8" }), name);
const fmt2 = (n: number | null) => (n === null ? "<5" : n.toFixed(2));

/** CFO-7: earned value at each month end against the 1.0 reference (decision Oct 18: real names, monthly). */
export function CfoSignals({ view, verdict }: { view: CfoView; verdict: VerdictResult }) {
  const [visible, setVisible] = useState({ spi: true, cpi: true });
  const timeline = view.timeline;
  const end = view.months[2].evm;
  const spi = typeof end.spi === "number" ? end.spi : null;
  const cpi = typeof end.cpi === "number" ? end.cpi : null;
  const ceiling = Math.max(1.5, Math.ceil(Math.max(...timeline.flatMap((t) => [t.spi ?? 0, t.cpi ?? 0])) * 2) / 2);
  return (
    <section className="decision-metrics">
      <div className="section-heading">
        <h2>Signals against reference</h2>
        <ShieldCheck size={23} />
      </div>
      <div className="signal-toggles no-print" role="group" aria-label="Visible reference signals">
        {(["spi", "cpi"] as const).map((key) => (
          <button key={key} className={`button signal-toggle signal-toggle--${key}`} aria-pressed={visible[key]} onClick={() => setVisible((c) => ({ ...c, [key]: !c[key] }))}>
            <span className="signal-swatch" aria-hidden="true" />
            {key.toUpperCase()}
            <span>{fmt2(key === "spi" ? spi : cpi)}</span>
          </button>
        ))}
      </div>
      <div className="signal-chart" role="group" aria-label={`Month-end SPI ${timeline.map((t) => fmt2(t.spi)).join(", ")} and CPI ${timeline.map((t) => fmt2(t.cpi)).join(", ")}; reference is 1`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeline} margin={{ top: 24, right: 18, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" ticks={[1, 2, 3]} tickFormatter={(m) => `M${m}`} tick={{ fontSize: 12, fill: "var(--ink)" }} />
            <YAxis width={42} domain={[0, ceiling]} tickFormatter={(x) => Number(x).toFixed(1)} tick={{ fontSize: 12, fill: "var(--ink)" }} />
            <Tooltip labelFormatter={(m) => `Pilot month ${m}`} formatter={(x) => Number(x).toFixed(2)} />
            <ReferenceLine y={1} stroke="var(--ink)" strokeDasharray="5 5" label={{ value: "Reference 1.0", position: "insideTopRight", fill: "var(--ink)", fontSize: 12 }} />
            <Line hide={!visible.spi} dataKey="spi" name="SPI" stroke="var(--signal-spi)" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} connectNulls={false} />
            <Line hide={!visible.cpi} dataKey="cpi" name="CPI" stroke="var(--signal-cpi)" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
        {!visible.spi && !visible.cpi && (
          <p className="signal-empty" role="status">
            Both signals hidden
          </p>
        )}
      </div>
      <details className="signal-explanation">
        <summary>About these signals and Jev AI’s decision</summary>
        <p>
          <strong>SPI · Schedule Performance Index.</strong> Care delivered against the plan (each place using its $500 of care evenly over weeks 3–13).{" "}
          {spi === null ? "Hidden while fewer than 5 people have used care." : `At ${spi.toFixed(2)}, delivery is ${spi >= 1 ? "on or ahead of" : "behind"} plan.`}
        </p>
        <p>
          <strong>CPI · Cost Performance Index.</strong> The $50/h budget rate against the rate actually paid.{" "}
          {cpi === null ? "Hidden while fewer than 5 people have used care." : `At ${cpi.toFixed(2)}, each hour cost ${cpi >= 1 ? "no more than" : "more than"} budgeted.`}
        </p>
        <h3>How this relates to Jev AI’s decision</h3>
        <p>These signals provide context, not a verdict on their own. Jev AI’s recommendation weighs outcome targets, uptake and demand.</p>
        <p>{view.explanation[verdict.category]}</p>
        <p className="aggregate-note">Month-end values from the pilot’s care records. Company-wide synthetic data only.</p>
      </details>
    </section>
  );
}

export function CfoReportActions({ view, verdict }: { view: CfoView; verdict: VerdictResult }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function exportPack() {
    setBusy(true);
    setError("");
    try {
      downloadBlob(await buildReportPack(view, verdict), "pilot-decision-pack.zip");
    } catch {
      setError("The ZIP could not be created. You can still print the report as PDF.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="cfo-export-actions no-print">
      <button className="button button--plum" onClick={exportPack} disabled={busy}>
        <Download size={17} />
        {busy ? "Preparing ZIP…" : "Download ZIP"}
      </button>
      <button className="button button--outline" onClick={() => window.print()}>
        <Printer size={17} />
        Print PDF
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

/** `assumptions` are the sliders' live values; `view` holds the numbers for the last values the server answered. */
export function CfoPlanning({ view: cfo, verdict, assumptions, onChange }: { view: CfoView; verdict: VerdictResult; assumptions: Assumptions; onChange: (a: Assumptions) => void }) {
  const { cost, graphs, inputs, defaults } = cfo;
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const [view, setView] = useState<"numbers" | "graph">("numbers");
  const range = period === "yearly" ? cost.annual : cost.monthly;
  const [printImages, setPrintImages] = useState<Record<string, string>>({});
  useEffect(() => {
    const preparePrint = () => flushSync(() => setPrintImages(Object.fromEntries(graphs.map((g) => [g.id, graphImageUrl(g)]))));
    window.addEventListener("beforeprint", preparePrint);
    return () => window.removeEventListener("beforeprint", preparePrint);
  }, [graphs]);
  return (
    <>
      <section className="cfo-section">
        <div className="section-heading section-heading--wrap">
          <h2>A practical planning range</h2>
          <div className="segment-control no-print" role="group" aria-label="Cost period">
            {(["monthly", "yearly"] as const).map((p) => (
              <button key={p} className={period === p ? "is-selected" : ""} aria-pressed={period === p} onClick={() => setPeriod(p)}>
                {p === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>
        <div className="money-grid">
          {(["low", "base", "high"] as const).map((item) => (
            <article key={item} className={item === "base" ? "is-base" : ""}>
              <p>
                {item[0]!.toUpperCase()}
                {item.slice(1)}
              </p>
              <strong>{money(range[item])}</strong>
              <span>per {period === "yearly" ? "year" : "month"}</span>
            </article>
          ))}
        </div>
        <fieldset className="cfo-assumptions-group">
          <legend>Cost assumptions</legend>
          <div className="cfo-assumptions">
            {fields.map((f) => (
              <label key={f.key}>
                <span>
                  {f.label}
                  <output>
                    {assumptions[f.key]} {f.unit}
                  </output>
                </span>
                <input aria-label={f.label} type="range" min={f.min} max={f.max} step={f.step} value={assumptions[f.key]} onChange={(e) => onChange({ ...assumptions, [f.key]: Number(e.target.value) })} />
              </label>
            ))}
            <button className="button button--outline cfo-reset no-print" onClick={() => onChange(defaults)}>
              <RefreshCcw size={16} />
              Reset assumptions
            </button>
          </div>
          <p className="aggregate-note">Starts from your pilot’s observed hours and uptake. Changes affect costs only, not pilot results.</p>
        </fieldset>
        <p className="projection-label">Projection, not a prediction · Low / base / high monthly cost · 80% planning range</p>
        <div className="projection-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cost.band} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} />
              <YAxis width={60} tickFormatter={(x) => (x >= 1000 ? `$${Math.round(x / 100) / 10}k` : `$${x}`)} />
              <Tooltip formatter={(x) => money(Number(x))} labelFormatter={(m) => `Month ${m}`} />
              <Area dataKey="high" fill="var(--red-soft)" stroke="var(--red-shape)" isAnimationActive={false} />
              <Area dataKey="low" fill="var(--paper)" stroke="var(--neutral-shape)" isAnimationActive={false} />
              <Line dataKey="base" stroke="var(--ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {printImages["monthly-cost"] && (
          // eslint-disable-next-line @next/next/no-img-element -- print-only data URL
          <img className="cfo-print-image" src={printImages["monthly-cost"]} alt="Base continuation cost by month" />
        )}
        <details className="chart-details">
          <summary>View as table</summary>
          <div className="chart-table-wrap">
            <table className="chart-table">
              <thead>
                <tr>
                  {["Month", "Low", "Base", "High"].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cost.band.map((r) => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{money(r.low)}</td>
                    <td>{money(r.base)}</td>
                    <td>{money(r.high)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="button button--outline chart-csv no-print" onClick={() => csv(projectionCsv(cost), "pilot-cost-projection.csv")}>
            <Download size={16} />
            Download CSV
          </button>
        </details>
      </section>
      <section className="cfo-section">
        <div className="section-heading section-heading--wrap">
          <div>
            <h2>What changed</h2>
            <p className="cfo-section-note">Company-wide results · Counts under 5 hidden</p>
          </div>
          <div className="segment-control no-print" role="group" aria-label="View results">
            {(["numbers", "graph"] as const).map((mode) => (
              <button key={mode} aria-pressed={view === mode} className={view === mode ? "is-selected" : ""} onClick={() => setView(mode)}>
                {mode === "numbers" ? "View as numbers" : "View as graph"}
              </button>
            ))}
          </div>
        </div>
        {view === "graph" && (
          <>
            <div className="cfo-graph-grid">
              {graphs.map((g, i) => {
                const points = g.baseline === null ? g.points : [{ month: 0, value: g.baseline }, ...g.points];
                return (
                  <article className="cfo-graph" key={g.id}>
                    <h3>{g.title}</h3>
                    <p>
                      {g.unit}
                      {g.baseline !== null ? ` · Baseline ${g.baseline}` : ""}
                    </p>
                    <div className="cfo-graph-canvas">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" tickFormatter={(x) => (Number(x) === 0 ? "Start" : `M${x}`)} interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                          <YAxis width={42} domain={i < 4 && i !== 1 ? [0, 7] : [0, "auto"]} tick={{ fontSize: 11 }} tickFormatter={(x) => (x >= 1000 ? `${Math.round(x / 1000)}k` : String(x))} />
                          <Tooltip labelFormatter={(x) => (Number(x) === 0 ? "Baseline" : `Month ${x}`)} />
                          {g.baseline !== null && <ReferenceLine y={g.baseline} stroke="var(--signal-cpi)" strokeDasharray="4 4" />}
                          <Line dataKey="value" name={g.title} stroke="var(--ink)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {g.points.some((p) => p.value === null) && <small>Counts under 5 hidden</small>}
                  </article>
                );
              })}
            </div>
            <button className="button button--outline chart-csv no-print" onClick={() => csv(graphsCsv(graphs), "pilot-all-graphs.csv")}>
              <Download size={16} />
              Download CSV
            </button>
          </>
        )}
        <div className="cfo-print-graphs">
          {graphs.map((g) =>
            printImages[g.id] ? (
              // eslint-disable-next-line @next/next/no-img-element -- print-only data URL
              <img key={g.id} src={printImages[g.id]} alt={g.title} />
            ) : null,
          )}
        </div>
        <div className={view === "numbers" ? "" : "cfo-print-evidence"}>
          <div className="cfo-evidence-table-wrap">
            <table className="cfo-evidence-table">
              <thead>
                <tr>
                  <th scope="col">Decision input</th>
                  <th scope="col">Baseline → Pilot end</th>
                  <th scope="col">Decision rule</th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">
                      {r.label}
                      <small>{r.unit}</small>
                    </th>
                    <td>
                      {r.before === null ? "" : `${show(r.before, (n) => n.toFixed(1))} → `}
                      {show(r.after, (n) => (r.before === null ? String(n) : n.toFixed(1)))}
                    </td>
                    <td>
                      <span className={`cfo-rule ${r.met ? "cfo-rule--met" : ""}`}>{r.met === null ? r.target : r.met ? "Target met" : "Below target"}</span>
                      {r.met !== null && <small>{r.target}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {view === "numbers" && (
            <button className="button button--outline chart-csv no-print" onClick={() => csv(inputsCsv(inputs), "pilot-what-changed.csv")}>
              <Download size={16} />
              Download CSV
            </button>
          )}
        </div>
      </section>
      <section className="cfo-section">
        <div className="cfo-reasoning">
          <h3>How {verdict.source === "jev" ? "Jev AI" : "the rules engine"} reached this recommendation</h3>
          <p>{cfo.explanation[verdict.category]}</p>
          <p className="cfo-section-note">
            {verdict.source === "jev"
              ? `Jev AI’s recommendation is checked against the rules above (${verdict.rulesAgree ? "they agree" : "they differ"}).`
              : "Jev AI was unavailable, so the rules above decided."}{" "}
            Planning sliders affect costs only; no employee-level data is used.
          </p>
        </div>
      </section>
    </>
  );
}
