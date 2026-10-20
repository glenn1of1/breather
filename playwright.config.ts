import { defineConfig } from "@playwright/test";

// Local: `npm run test:e2e` starts `next dev`. CI: starts the production build (`next start`).
// Either way the app talks to whatever DATABASE_URL is set: use the PREVIEW database, never the demo one.
// The demo is gated (SEC-1): the "auth" project signs in once with E2E_ACCESS_CODE (default: the first
// DEMO_ACCESS_CODES entry) and every other test reuses that cookie. gate.spec.ts runs signed out.
const AUTH_STATE = "e2e/.auth/state.json";

export default defineConfig({
  testDir: "e2e",
  // Tests share one database, so run them one at a time.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  projects: [
    { name: "auth", testMatch: /auth\.setup\.ts/ },
    { name: "gate", testMatch: /gate\.spec\.ts/ },
    { name: "demo", testIgnore: /gate\.spec\.ts/, dependencies: ["auth"], use: { storageState: AUTH_STATE } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "npm run start" : "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
