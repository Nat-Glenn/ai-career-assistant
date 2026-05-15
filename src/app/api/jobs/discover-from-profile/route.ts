import { NextResponse } from "next/server";
import {
  discoverJobsFromProfile,
  ProfileIncompleteError,
} from "@/services/job-discovery";

/**
 * POST /api/jobs/discover-from-profile — discover jobs using saved career preferences.
 */
export async function POST() {
  try {
    const result = await discoverJobsFromProfile();

    return NextResponse.json({
      data: result.jobs,
      meta: result.meta,
    });
  } catch (error) {
    if (error instanceof ProfileIncompleteError) {
      return NextResponse.json(
        {
          error: {
            code: "PROFILE_INCOMPLETE",
            message: error.message,
            missing: error.missing,
          },
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Profile-based job discovery failed.";

    return NextResponse.json(
      { error: { code: "DISCOVERY_FAILED", message } },
      { status: 502 },
    );
  }
}
