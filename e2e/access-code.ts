// SEC-1: the code e2e signs in with (E2E_ACCESS_CODE, or the first DEMO_ACCESS_CODES entry).
export const accessCode = () => process.env.E2E_ACCESS_CODE ?? process.env.DEMO_ACCESS_CODES?.split(",")[0]?.trim() ?? "";
