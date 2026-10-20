// PRD SUR-7 and the final UI's accessibility audit: every page passes an automatic WCAG 2.1 AA check.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES: [string, number][] = [
  ["/demo/s/demo", 6],
  ["/demo/preview", 6],
  ["/demo/employee/email", 6],
  ["/demo/hr/email", 6],
  ["/demo/hr", 6],
  ["/demo/hr/report", 13],
  ["/demo/cfo", 6],
  ["/demo/cfo", 13],
  ["/demo/cfo/email", 13],
];

for (const [path, week] of PAGES) {
  test(`${path} at week ${week} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto("/demo/hr");
    await page.evaluate((w) => localStorage.setItem("breather-week", String(w)), week);
    await page.goto(path);
    // Wait for real data (or the locked state) instead of the loading skeleton.
    await expect(page.locator("[aria-busy=true].state-card")).toHaveCount(0, { timeout: 15_000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

// SHOW-1, SEC-1: the public showcase, the access page and 404, on desktop and phone widths.
for (const path of ["/", "/access", "/access?error=invalid", "/no-such-page"]) {
  for (const width of [1280, 375]) {
    test(`${path} at ${width}px has no WCAG 2.1 AA violations and no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}
