// SEC-1: sign in to the gated demo once and save the cookie for the other specs.
import { expect, test as setup } from "@playwright/test";
import { accessCode } from "./access-code";

setup("sign in with an access code", async ({ request }) => {
  const res = await request.post("/api/access", { data: { code: accessCode() } });
  expect(res.status(), "set E2E_ACCESS_CODE (or DEMO_ACCESS_CODES) to a code the server accepts").toBe(200);
  await request.storageState({ path: "e2e/.auth/state.json" });
});
