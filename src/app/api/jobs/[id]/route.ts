import { NextResponse } from "next/server";
import {
  getDiscoveredJob,
  JobNotFoundError,
} from "@/services/job-discovery";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/jobs/[id] — fetch one discovered job from storage.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const data = await getDiscoveredJob(id);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof JobNotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to load job.";

    return NextResponse.json(
      { error: { code: "LOAD_FAILED", message } },
      { status: 500 },
    );
  }
}
