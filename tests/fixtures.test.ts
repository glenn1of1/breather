// Guards the FE/BE contract: every fixture must match its schema in lib/contracts.ts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as C from "@/lib/contracts";

const SCHEMA_BY_PREFIX: Record<string, { parse: (v: unknown) => unknown }> = {
  survey: C.SurveyResult, dashboard: C.DashboardSnapshot, verdict: C.VerdictResult,
  "cost.assumptions": C.CostAssumptions, cost: C.CostResult, preview: C.PreviewResult,
  pii: C.PiiResult, seed: C.SeedResult, "report-receipt": C.ReportReceipt,
};
const dir = join(__dirname, "..", "fixtures");

describe("fixtures match contracts", () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    it(file, () => {
      const name = file.replace(/\.json$/, "");
      const key = Object.keys(SCHEMA_BY_PREFIX).sort((a, b) => b.length - a.length).find((k) => name === k || name.startsWith(`${k}.`));
      expect(key, `no schema mapped for ${file}`).toBeDefined();
      expect(() => SCHEMA_BY_PREFIX[key!]!.parse(JSON.parse(readFileSync(join(dir, file), "utf8")))).not.toThrow();
    });
  }
});
