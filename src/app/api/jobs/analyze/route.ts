import { NextResponse } from "next/server";
import { analyzeJobDescriptionSchema } from "@/lib/validators";
import { analyzeJobDescription } from "@/services/job-analysis";

/**
 * POST /api/jobs/analyze
 *
 * Accepts a job description and returns structured analysis from OpenAI.
 * No UI in this step — test with curl or an API client.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const validation = analyzeJobDescriptionSchema.safeParse(body);

  if (!validation.success) {
    const message =
      validation.error.issues[0]?.message ?? "Invalid request body.";

    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message,
        },
      },
      { status: 400 },
    );
  }

  try {
    const data = await analyzeJobDescription(validation.data.jobDescription);

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Job analysis failed.";

    // Missing API key is a server configuration issue, not a client mistake.
    const status = message.includes("OPENAI_API_KEY") ? 500 : 502;

    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message,
        },
      },
      { status },
    );
  }
}
