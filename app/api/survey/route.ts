// PRD SUR-3..6. Validate → eligibility → insert → allocate → recompute, in one transaction.
import { writer } from "@/db/intake";
import { SurveyRequest, SurveyResult } from "@/lib/contracts";
import { submitSurvey, UnknownTokenError } from "@/lib/survey/submit";

export async function POST(req: Request) {
  const body = SurveyRequest.safeParse(await req.json().catch(() => null));
  // Validation issues name fields and rules only; they never echo submitted values.
  if (!body.success) return Response.json({ error: body.error.issues.map((i) => ({ path: i.path, code: i.code })) }, { status: 400 });
  try {
    return Response.json(SurveyResult.parse(await submitSurvey(writer(), body.data.token, body.data.answers)));
  } catch (e) {
    if (e instanceof UnknownTokenError) return Response.json({ error: "this link is not valid" }, { status: 404 });
    console.error("survey submit failed", (e as { code?: string }).code ?? "unknown"); // never log the body (H5)
    return Response.json({ error: "could not save your answers, please try again" }, { status: 500 });
  }
}
