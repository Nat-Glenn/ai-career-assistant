import type { DiscoveredJob } from "@/types/job";
import { fetchAdzunaJobs, isAdzunaConfigured } from "./adzuna";
import { fetchRemoteOkJobs } from "./remoteok";

const USER_AGENT =
  "AI-Career-Assistant/1.0 (portfolio; educational job aggregation)";

export type JobSourceFetchOptions = {
  query: string;
  location?: string;
};

/** Sources that are configured and may be used in a discovery run. */
export function getActiveJobSources(): string[] {
  const sources = ["remoteok"];

  if (isAdzunaConfigured()) {
    sources.push("adzuna");
  }

  return sources;
}

async function safeFetchSource(
  source: string,
  fetcher: () => Promise<DiscoveredJob[]>,
): Promise<DiscoveredJob[]> {
  try {
    return await fetcher();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown source error";

    console.error(`[job-discovery] ${source} failed: ${message}`);

    return [];
  }
}

/**
 * Feed-based sources that return a broad listing (filtered client-side).
 */
export async function fetchBulkJobSources(): Promise<DiscoveredJob[]> {
  const remoteOk = await safeFetchSource("remoteok", fetchRemoteOkJobs);

  return remoteOk;
}

/**
 * Search-based sources that accept a query (and optional location).
 */
export async function fetchSearchJobSources(
  options: JobSourceFetchOptions,
): Promise<DiscoveredJob[]> {
  if (!isAdzunaConfigured()) {
    return [];
  }

  const adzuna = await safeFetchSource("adzuna", () =>
    fetchAdzunaJobs({
      query: options.query,
      location: options.location,
    }),
  );

  return adzuna;
}

/**
 * Fetches from all available sources and merges listings.
 * Failures in one source do not block others.
 */
export async function fetchAllJobSources(
  options: JobSourceFetchOptions,
): Promise<DiscoveredJob[]> {
  const [bulk, search] = await Promise.all([
    fetchBulkJobSources(),
    fetchSearchJobSources(options),
  ]);

  return [...bulk, ...search];
}

export { USER_AGENT };
