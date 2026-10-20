// SHOW-3: absolute base URL for canonical and Open Graph links. Every Vercel build (production and
// previews) points at the production domain; locally it falls back to NEXT_PUBLIC_APP_URL.
// Named explicitly: VERCEL_PROJECT_PRODUCTION_URL still gave the vercel.app domain after breather.dev was added.
const PRODUCTION_URL = "https://breather.dev";

export const SITE_URL = process.env.VERCEL ? PRODUCTION_URL : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
