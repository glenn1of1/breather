import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] } },
  // Privacy wall (PRD PRV-1): dashboard code may only use the read-only employer connection.
  {
    files: ["app/demo/hr/**", "app/demo/cfo/**", "app/demo/preview/**", "app/api/dashboard/**", "app/api/verdict/**", "app/api/cost/**", "app/api/cfo/**", "app/api/preview/**", "components/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/db/intake", "**/db/intake"], message: "Dashboard code must use db/employer (dashboard). See PRD PRV-1." }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
