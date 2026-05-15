import { NextResponse } from "next/server";
import { discoverJobsSchema } from "@/lib/validators";
import {
  discoverJobs,
  getActiveJobSources,
  listDiscoveredJobs,
} from "@/services/job-discovery";

/**
 * GET /api/jobs — list discovered jobs from data/jobs.json
 * POST /api/jobs — trigger job discovery from public sources
 */
export async function GET() {
  try {
    const data = await listDiscoveredJobs();

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list jobs.";

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

  const validation = discoverJobsSchema.safeParse(body);

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
    const data = await discoverJobs(validation.data);

    return NextResponse.json(
      {
        data,
        meta: {
          count: data.length,
          sources: getActiveJobSources(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Job discovery failed.";

    return NextResponse.json(
      { error: { code: "DISCOVERY_FAILED", message } },
      { status: 502 },
    );
  }
}
