"use client";
// PRD SUR-1..6. The final UI's employee portal with OUR questions (config/survey.ts; team decision
// Oct 18: keep the original wording). Submit → /api/survey → one of the four honest outcomes.
// SEC-3: the question set arrives as props from the server page, so it is not in the client bundle.
import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Copy, Download, ShieldCheck } from "lucide-react";
import type { SurveyQuestion } from "@/config/survey";
import { OUTCOME_COPY, RESOURCES } from "@/config/copy";
import type { SurveyAnswers, SurveyResult } from "@/lib/contracts";
import { ApiError, submitSurvey } from "@/lib/client/api";
import { useDemo } from "@/components/demo/demo-provider";
import { AppFrame } from "./shell";
import { Logo } from "./ui";

type Value = string | number | boolean;

function toAnswers(v: Record<string, Value>): SurveyAnswers {
  return {
    q1: v.q1 as "yes" | "no",
    q2: v.q2 as SurveyAnswers["q2"],
    q3: v.q3 as SurveyAnswers["q3"],
    q4: v.q4 as "yes" | "no",
    q5: v.q5 as "yes" | "no",
    q6: Number(v.q6),
    q7: v.q7 as "yes" | "no",
    q8: v.q8 === true,
    q9: v.q9 as SurveyAnswers["q9"],
    q10: Number(v.q10),
    q11: Number(v.q11),
    q12Contact: typeof v.q12 === "string" && v.q12.trim() ? v.q12.trim() : undefined,
  };
}

export function SurveyPage({ questions }: { questions: SurveyQuestion[] }) {
  const requiredCount = questions.filter((q) => q.required).length;
  const { token } = useParams<{ token: string }>();
  const { bump } = useDemo();
  const [values, setValues] = useState<Record<string, Value>>({});
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const missing = questions.filter((q) => q.required && values[q.id] === undefined).length;
  const set = (id: string, v: Value) => setValues((cur) => ({ ...cur, [id]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (missing) return;
    setSending(true);
    setError(null);
    try {
      setResult(await submitSurvey(token, toAnswers(values)));
      bump();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "This survey link isn’t valid. Ask your employer for the current link." : "We couldn’t save your answers. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppFrame app="employee">
      <div className="survey-shell">
        <div className="employee-portal-grid">
          <div className="employee-info-column">
            <section className="survey-intro">
              <Logo compact />
              <h1>Support from SE Health</h1>
              <p>SE Health provides practical care and support for people helping a family member or friend.</p>
            </section>
            <section className="claim-status-preview">
              <h2>About the program</h2>
              <p>Your employer’s caregiver support pilot connects eligible employees with SE Health services, including household help, companionship and personal care.</p>
              <p>Support is designed to make caregiving more manageable alongside work. Check eligibility here, then use your claim number for follow-up check-ins.</p>
              <a className="program-contact" href="https://sehc.com/contact-us" target="_blank" rel="noopener noreferrer">
                Contact SE Health <ArrowRight size={16} />
              </a>
            </section>
          </div>

          {result ? (
            <Result result={result} />
          ) : (
            <form className="survey-form employee-form" onSubmit={submit}>
              <div className="employee-form__heading">
                <div className="survey-privacy">
                  <ShieldCheck size={22} />
                  <p>
                    <strong>Your check-in is anonymous.</strong> We don’t ask for your name, email or employee ID. Your employer only sees company-wide totals, never your individual answers. Please leave identifying details out of comments.
                  </p>
                </div>
                <h2>A few questions about what would help</h2>
                <p className="required-note">
                  <span aria-hidden="true">*</span> Required question
                </p>
              </div>
              {questions.map((q, i) => (
                <Question key={q.id} q={q} n={i + 1} value={values[q.id]} onChange={(v) => set(q.id, v)} />
              ))}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {missing > 0 && <p className="form-note">Answer questions 1–{requiredCount} to submit your check-in.</p>}
              <button className="button button--red button--wide" type="submit" disabled={missing > 0 || sending}>
                {sending ? "Submitting…" : "Submit my check-in"} <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </AppFrame>
  );
}

function Question({ q, n, value, onChange }: { q: SurveyQuestion; n: number; value: Value | undefined; onChange: (v: Value) => void }) {
  if (q.kind === "text") {
    return (
      <label className="optional-text">
        <strong>
          {n}. {q.text.replace(/^Optional: /, "")} <span>Optional</span>
        </strong>
        {q.hint && <small>{q.hint}</small>}
        <input type="text" inputMode="email" autoComplete="off" maxLength={200} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Phone or email (optional)" />
      </label>
    );
  }
  if (q.kind === "confirm") {
    return (
      <fieldset>
        <legend>
          <span>{n}</span>
          <strong>Confirmation</strong>
        </legend>
        <div className="choice-grid choice-grid--single">
          <label>
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
            <span>{q.text}</span>
          </label>
        </div>
      </fieldset>
    );
  }
  const options =
    q.kind === "yesno"
      ? [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]
      : q.kind === "choice"
        ? q.options
        : Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  return (
    <fieldset>
      <legend>
        <span>{n}</span>
        <strong>
          {q.text}{" "}
          {q.required && (
            <span className="required-star" aria-label="required">
              *
            </span>
          )}
        </strong>
      </legend>
      {q.kind === "scale7" && (
        <p className="scale-hint">
          1 = {q.lowLabel} · 7 = {q.highLabel}
        </p>
      )}
      <div className={`choice-grid ${q.kind === "scale7" ? "choice-grid--scale" : ""}`}>
        {options.map((o) => (
          <label key={o.value}>
            <input type="radio" name={q.id} value={o.value} checked={String(value) === o.value} onChange={() => onChange(q.kind === "scale7" ? Number(o.value) : o.value)} required={q.required} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Result({ result }: { result: SurveyResult }) {
  const [copied, setCopied] = useState(false);
  const copy = OUTCOME_COPY[result.outcome];
  const claim = result.claimNo;
  const save = () => {
    if (!claim) return;
    const url = URL.createObjectURL(new Blob([`Breather demo claim number: ${claim}\nKeep your claim number.`], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "breather-claim.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="survey-result" aria-live="polite">
      <p className="label">{claim ? "Submission received" : "Thanks for your answers"}</p>
      <h1>{copy.title}</h1>
      <p>{copy.body.replace("{decidedOn}", result.decidedOn ?? "the end of the enrolment window")}</p>
      {claim ? (
        <>
          <div className="claim-card">
            <span>Your claim number</span>
            <strong>{claim}</strong>
            <p>Keep your claim number.</p>
          </div>
          <div className="button-row">
            <button
              className="button button--plum"
              onClick={() => {
                navigator.clipboard?.writeText(claim);
                setCopied(true);
              }}
            >
              <Copy size={18} /> {copied ? "Copied" : "Copy"}
            </button>
            <button className="button button--outline" onClick={save}>
              <Download size={18} /> Save
            </button>
          </div>
        </>
      ) : (
        <ul className="resource-list">
          {RESOURCES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
