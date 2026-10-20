import "./site.css";

// SHOW-1: the public showcase, the access page and their shared styles (not the demo's).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="site">{children}</div>;
}
