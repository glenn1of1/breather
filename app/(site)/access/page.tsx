import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CircleAlert } from "lucide-react";
import { accessMailto } from "@/content/showcase";

// SEC-1. The gate's front door: a plain form, so it works without JavaScript. /api/access checks the
// code and sets the cookie; proxy.ts sends every unauthenticated demo request here.
export const metadata: Metadata = {
  title: "Demo access · Breather",
  description: "Enter your access code to open the Breather live demo.",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid: "That code didn’t work. Check it and try again, or request a new one.",
  unavailable: "Demo access isn’t available right now. Please request access by email.",
};

type Search = Promise<{ next?: string | string[]; error?: string | string[] }>;

export default function AccessPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="gate" id="main-content">
      <div className="card gate__card">
        <Link className="wordmark" href="/">
          <span className="wordmark__leaf" aria-hidden="true" />
          Breather
        </Link>
        <h1>Open the live demo</h1>
        <p className="gate__lead">The demo is private. Enter the access code you were sent. Every number in it is synthetic.</p>
        {/* The form needs ?next= from the URL, which streams in a moment later; until then it's disabled. */}
        <Suspense fallback={<AccessForm next="/demo" error={null} pending />}>
          <AccessFormFromUrl searchParams={searchParams} />
        </Suspense>
        <p className="gate__foot">
          <Link href="/">← Back to the overview</Link>
          <a href={accessMailto()}>Request a code</a>
        </p>
      </div>
    </main>
  );
}

async function AccessFormFromUrl({ searchParams }: { searchParams: Search }) {
  const { next, error } = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <AccessForm next={one(next) ?? "/demo"} error={ERRORS[one(error) ?? ""] ?? null} />;
}

function AccessForm({ next, error, pending = false }: { next: string; error: string | null; pending?: boolean }) {
  return (
    <>
      {error && (
        <p className="gate__error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          {error}
        </p>
      )}
      <form method="post" action="/api/access">
        <fieldset className="gate__fields" disabled={pending}>
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code">Access code</label>
          <input id="code" name="code" type="text" required maxLength={200} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-invalid={error ? true : undefined} />
          <button className="btn" type="submit">
            Open the demo
          </button>
        </fieldset>
      </form>
    </>
  );
}
