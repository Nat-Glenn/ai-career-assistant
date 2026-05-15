import { NextResponse } from "next/server";
import { generateCoverLetterSchema } from "@/lib/validators";
import { generateCoverLetter } from "@/services/cover-letter/generate";

/**
 * POST /api/cover-letter/generate
 *
 * Accepts resume, job description, and optional context; returns a cover letter.
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

  const validation = generateCoverLetterSchema.safeParse(body);

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
    const data = await generateCoverLetter(validation.data);

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cover letter generation failed.";

    const status = message.includes("OPENAI_API_KEY") ? 500 : 502;

    return NextResponse.json(
      {
        error: {
          code: "COVER_LETTER_FAILED",
          message,
        },
      },
      { status },
    );
  }
}
