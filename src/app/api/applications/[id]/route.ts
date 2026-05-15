import { NextResponse } from "next/server";
import { updateApplicationSchema } from "@/lib/validators";
import {
  ApplicationNotFoundError,
  deleteApplication,
  updateApplication,
} from "@/services/applications/tracker";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/applications/[id] — update an application.
 * DELETE /api/applications/[id] — remove an application.
 */
export async function PATCH(request: Request, context: RouteContext) {
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

  const validation = updateApplicationSchema.safeParse(body);

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
    const data = await updateApplication(id, validation.data);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update application.";

    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await deleteApplication(id);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete application.";

    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message } },
      { status: 500 },
    );
  }
}
