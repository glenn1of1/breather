import Link from "next/link";
import "./(site)/site.css";

// Unmatched URLs anywhere (the root layout has no styles of its own, so this loads the site's).
export default function NotFound() {
  return (
    <div className="site">
      <title>Page not found · Breather</title>
      <meta name="robots" content="noindex" />
      <main className="gate" id="main-content">
        <div className="card gate__card">
          <Link className="wordmark" href="/">
            <span className="wordmark__leaf" aria-hidden="true" />
            Breather
          </Link>
          <p className="eyebrow">404</p>
          <h1>This page isn’t in the pilot.</h1>
          <p className="gate__lead">The link may be old. The overview has everything, and the live demo is one access code away.</p>
          <p className="gate__foot">
            <Link href="/">← Back to the overview</Link>
            <a href="/demo">Open the demo</a>
          </p>
        </div>
      </main>
    </div>
  );
}
