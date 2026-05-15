import { NextResponse } from "next/server";
import { discoverJobsSchema } from "@/lib/validators";
import {
  discoverJobs,
  getActiveJobSources,
  listDiscoveredJobs,
  type DiscoverJobsInput,
} from "@/services/job-discovery";

function parseKeywordsParam(value: string | null): string[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const list = value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return list.length > 0 ? list : undefined;
}

/**
 * GET /api/jobs — list discovered jobs from data/jobs.json
 * Optional query params (match manual discovery): query, location, remoteOnly, keywords (comma-separated).
 * When `query` is set, results are filtered and re-ranked for that search.
 * POST /api/jobs — trigger job discovery from public sources
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query")?.trim();
    const location = url.searchParams.get("location")?.trim();
    const remoteOnlyParam = url.searchParams.get("remoteOnly");
    const keywords = parseKeywordsParam(url.searchParams.get("keywords"));

    const hasScope = Boolean(query);

    const filters: DiscoverJobsInput | null = hasScope
      ? {
          query: query!,
          location: location || undefined,
          remoteOnly: remoteOnlyParam === "true",
          keywords,
        }
      : null;

    const data = await listDiscoveredJobs(filters);

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
