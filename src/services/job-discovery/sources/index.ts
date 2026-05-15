import type { DiscoveredJob } from "@/types/job";
import { isLikelyTechRoleQuery } from "../query-match";
import { fetchAdzunaJobs, isAdzunaConfigured } from "./adzuna";
import { fetchRemoteOkJobs } from "./remoteok";

const USER_AGENT =
  "AI-Career-Assistant/1.0 (portfolio; educational job aggregation)";

export type JobSourceFetchOptions = {
  query: string;
  location?: string;
};

export type FetchDiscoverySourcesResult = {
  jobs: DiscoveredJob[];
  /** Count of raw rows returned per source before merge/dedupe */
  fetchedPerSource: Record<string, number>;
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

export type FetchDiscoveryMemo = {
  remoteOkBulk?: DiscoveredJob[];
};

/**
 * Chooses sources by query shape: non-tech queries prefer Adzuna (broader industries)
 * and skip RemoteOK bulk when Adzuna is configured so tech-heavy feeds do not dominate.
 */
export async function fetchJobsForDiscovery(
  options: JobSourceFetchOptions,
  memo?: FetchDiscoveryMemo,
): Promise<FetchDiscoverySourcesResult> {
  const tech = isLikelyTechRoleQuery(options.query);
  const adzunaOn = isAdzunaConfigured();

  const fetchedPerSource: Record<string, number> = {};

  const adzunaResults = adzunaOn
    ? await safeFetchSource("adzuna", () =>
        fetchAdzunaJobs({
          query: options.query,
          location: options.location,
        }),
      )
    : [];

  fetchedPerSource.adzuna = adzunaResults.length;

  if (!tech && adzunaOn && adzunaResults.length > 0) {
    return {
      jobs: adzunaResults,
      fetchedPerSource,
    };
  }

  let remoteOkResults = memo?.remoteOkBulk;

  if (remoteOkResults === undefined) {
    remoteOkResults = await safeFetchSource("remoteok", fetchRemoteOkJobs);

    if (memo) {
      memo.remoteOkBulk = remoteOkResults;
    }
  }

  fetchedPerSource.remoteok = remoteOkResults.length;

  if (!tech && adzunaOn && adzunaResults.length === 0) {
    return {
      jobs: remoteOkResults,
      fetchedPerSource,
    };
  }

  return {
    jobs: [...remoteOkResults, ...adzunaResults],
    fetchedPerSource,
  };
}

export { USER_AGENT };
