// Demo path (PRD G1) through the real APIs on the PREVIEW database:
// seed → survey submit → HR count moves → week-13 verdict per scenario → week-12 lock.
// Grows into full UI clicks as the real screens land.
import { expect, test } from "@playwright/test";

const ANSWERS = { q1: "yes", q2: "5-19", q3: "3m+", q4: "no", q5: "no", q6: 5, q7: "no", q8: true, q9: "1-2", q10: 5, q11: 3 };

test.describe.configure({ mode: "serial" });

// H8: always leave the preview database in the default state, even when a test fails.
test.afterAll(async ({ request }) => {
  await request.post("/api/demo/seed?scenario=scale");
});

for (const path of ["/demo", "/demo/s/demo", "/demo/hr", "/demo/cfo", "/demo/preview", "/demo/hr/email"]) {
  test(`${path} loads`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByText("Synthetic data")).toBeVisible();
  });
}

test("a live sign-up is accepted and moves the week-1 HR total by one", async ({ request }) => {
  expect((await request.post("/api/demo/seed?scenario=scale")).ok()).toBe(true);
  const before = await (await request.get("/api/dashboard?week=1")).json();

  const t0 = Date.now();
  const res = await request.post("/api/survey", { data: { token: "demo", answers: ANSWERS } });
  expect(res.ok()).toBe(true);
  // SUR-3's 2 s budget is about the stage and is measured on production by `npm run checkpoint`.
  // CI runners sit further from the database, so here it is only a sanity limit.
  expect(Date.now() - t0).toBeLessThan(process.env.CI ? 5_000 : 2_000);
  const out = await res.json();
  expect(out.outcome).toBe("accepted");
  expect(out.claimNo).toMatch(/^PH-[0-9A-HJKMNP-TV-Z]{4}-\d{2}$/);

  const after = await (await request.get("/api/dashboard?week=1")).json();
  expect(after.counts.potentialCaregivers).toBe(before.counts.potentialCaregivers + 1);
  expect(JSON.stringify(after)).not.toContain(out.claimNo); // PRV-2: no claim numbers in dashboard data
});

test("the survey UI submits a live sign-up and shows a claim number (SUR-3, SUR-4)", async ({ page, request }) => {
  expect((await request.post("/api/demo/seed?scenario=scale")).ok()).toBe(true);
  await page.goto("/demo/s/demo");
  const pick = ["Yes", "5 to 19", "3 months or more", "No", "No", "5", "No", "1 to 2", "5", "3"];
  const sets = page.locator("form fieldset");
  for (const [i, label] of pick.entries()) await sets.nth(i).getByRole("radio", { name: label, exact: true }).check();
  await sets.nth(pick.length).getByRole("checkbox").check();
  await page.getByRole("button", { name: /Submit my check-in/ }).click();
  await expect(page.getByText("Your claim number")).toBeVisible();
  await expect(page.getByText(/^PH-[0-9A-HJKMNP-TV-Z]{4}-\d{2}$/)).toBeVisible();
});

test("unticked Q8 is not eligible and returns no claim number", async ({ request }) => {
  const out = await (await request.post("/api/survey", { data: { token: "demo", answers: { ...ANSWERS, q8: false } } })).json();
  expect(out).toEqual({ outcome: "not_eligible" });
});

for (const scenario of ["scale", "sustain", "stop"] as const) {
  test(`${scenario}: week-13 verdict matches the scenario`, async ({ request }) => {
    expect((await request.post(`/api/demo/seed?scenario=${scenario}`)).ok()).toBe(true);
    const v = await (await request.post("/api/verdict")).json();
    expect(v.category).toBe(scenario);
    expect(v.reasons.length).toBeGreaterThanOrEqual(3);
  });
}

test("the CFO verdict is locked before week 13 (CFO-6)", async ({ request }) => {
  const res = await request.post("/api/verdict?week=12");
  expect(res.status()).toBe(409);
});

test("an unknown survey link is rejected", async ({ request }) => {
  expect((await request.post("/api/survey", { data: { token: "nope", answers: ANSWERS } })).status()).toBe(404);
});
