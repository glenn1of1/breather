import type { NextConfig } from "next";

/** SHOW-2: the demo moved under /demo. Old links (README, pitch deck, video) keep working. */
const MOVED = ["/hr", "/hr/:path*", "/cfo", "/cfo/:path*", "/employee/:path*", "/preview", "/s/:token"];

const dev = process.env.NODE_ENV !== "production";

/**
 * SEC-5. Strict where it doesn't break the app: everything is same-origin, nothing may frame the site,
 * and plugins, <base> and cross-site form posts are off. Scripts and styles still allow inline code:
 * Next's bootstrap scripts carry no nonce unless every page renders per request, and Recharts sets
 * inline styles. Dev also needs eval and the HMR websocket.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/** SHOW-3: the gated demo, the access page and the API are never indexed (robots.ts disallows them too). */
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // SEC-5: never ship browser source maps (this is the default; stated so nobody flips it).
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  partialPrefetching: true,
  turbopack: {
    // Pin the root: a package-lock.json in the parent folder otherwise confuses root detection.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      ...["/demo", "/demo/:path*", "/access", "/api/:path*"].map((source) => ({ source, headers: NOINDEX })),
    ];
  },
  async redirects() {
    return MOVED.map((source) => ({ source, destination: `/demo${source}`, permanent: false }));
  },
};

export default nextConfig;
