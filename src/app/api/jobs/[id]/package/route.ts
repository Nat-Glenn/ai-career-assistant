import { NextResponse } from "next/server";
import { generatePackageSchema } from "@/lib/validators";
import { generateApplicationPackage } from "@/services/job-package";
import {
  getDiscoveredJob,
  JobNotFoundError,
} from "@/services/job-discovery";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/jobs/[id]/package
 * Generates job analysis, ATS optimization, resume tailoring, and cover letter.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

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

  const validation = generatePackageSchema.safeParse(body);

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
    const job = await getDiscoveredJob(id);
    const data = await generateApplicationPackage(job, validation.data.resumeText);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof JobNotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Package generation failed.";

    const status = message.includes("OPENAI_API_KEY") ? 500 : 502;

    return NextResponse.json(
      { error: { code: "PACKAGE_FAILED", message } },
      { status },
    );
  }
}
