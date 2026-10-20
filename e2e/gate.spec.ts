// SEC-1, SHOW-1: signed out, the showcase is public and everything else is gated.
import { expect, test } from "@playwright/test";
import { accessCode } from "./access-code";

test("the showcase loads without a code", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Breather" })).toBeVisible();
});

test("demo pages redirect to /access and API calls get 401", async ({ page, request }) => {
  await page.goto("/demo/cfo");
  await expect(page).toHaveURL(/\/access\?next=%2Fdemo%2Fcfo$/);
  for (const [method, path] of [["POST", "/api/verdict"], ["POST", "/api/pii"], ["GET", "/api/dashboard?week=1"], ["POST", "/api/demo/seed?scenario=scale"]] as const) {
    const res = await request.fetch(path, { method });
    expect(res.status(), `${method} ${path}`).toBe(401);
  }
});

test("a wrong code is refused, the right one opens the demo where the visitor was going", async ({ page }) => {
  await page.goto("/access?next=%2Fdemo%2Fcfo");
  await page.getByLabel("Access code").fill("not-a-real-code");
  await page.getByRole("button", { name: "Open the demo" }).click();
  await expect(page.locator(".gate__error")).toContainText("didn’t work");
  await page.getByLabel("Access code").fill(accessCode());
  await page.getByRole("button", { name: "Open the demo" }).click();
  await expect(page).toHaveURL(/\/demo\/cfo$/);
  await expect(page.getByText("Synthetic data")).toBeVisible();
});
