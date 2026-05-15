import { NextResponse } from "next/server";
import { tailorResumeSchema } from "@/lib/validators";
import { tailorResume } from "@/services/resume/tailor";

/**
 * POST /api/resume/tailor
 *
 * Accepts resume text and a job description; returns tailored suggestions.
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

  const validation = tailorResumeSchema.safeParse(body);

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
    const data = await tailorResume(
      validation.data.resumeText,
      validation.data.jobDescription,
    );

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume tailoring failed.";

    const status = message.includes("OPENAI_API_KEY") ? 500 : 502;

    return NextResponse.json(
      {
        error: {
          code: "TAILORING_FAILED",
          message,
        },
      },
      { status },
    );
  }
}
