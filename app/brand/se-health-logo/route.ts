// SHOW-2: SE Health's logo is their brand asset, so it stays out of the repo. Deployments set
// SE_HEALTH_LOGO_PNG_BASE64 (a 640px PNG, base64) and get the real logo; anywhere else
// (local, CI, a clone) gets a plain "SE Health" wordmark so the demo still lays out the same.
// Reads only env, so it is prerendered at build time.

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 340" role="img" aria-label="SE Health"><text x="320" y="170" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, Segoe UI, Arial, sans-serif" font-size="112" font-weight="600" fill="#432844">SE Health</text></svg>`;

export function GET() {
  const logo = process.env.SE_HEALTH_LOGO_PNG_BASE64?.trim();
  const headers = { "Cache-Control": "public, max-age=86400" };
  if (logo) return new Response(Buffer.from(logo, "base64"), { headers: { ...headers, "Content-Type": "image/png" } });
  return new Response(FALLBACK_SVG, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
}
