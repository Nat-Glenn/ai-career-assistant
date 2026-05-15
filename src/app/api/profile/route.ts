import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validators";
import { getProfile, updateProfile } from "@/services/profile";

/**
 * GET /api/profile — load saved career preferences.
 * PUT /api/profile — save career preferences.
 */
export async function GET() {
  try {
    const data = await getProfile();

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile.";

    return NextResponse.json(
      { error: { code: "LOAD_FAILED", message } },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
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

  const validation = updateProfileSchema.safeParse(body);

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
    const data = await updateProfile(validation.data);

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile.";

    return NextResponse.json(
      { error: { code: "SAVE_FAILED", message } },
      { status: 500 },
    );
  }
}
