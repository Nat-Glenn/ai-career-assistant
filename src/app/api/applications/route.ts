import { NextResponse } from "next/server";
import { createApplicationSchema } from "@/lib/validators";
import {
  createApplication,
  listApplications,
} from "@/services/applications/tracker";

/**
 * GET /api/applications — list all tracked applications.
 * POST /api/applications — create a new application record.
 */
export async function GET() {
  try {
    const data = await listApplications();
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list applications.";

    return NextResponse.json(
      { error: { code: "LIST_FAILED", message } },
      { status: 500 },
    );
  }
}

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

  const validation = createApplicationSchema.safeParse(body);

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
    const data = await createApplication(validation.data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create application.";

    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message } },
      { status: 500 },
    );
  }
}
