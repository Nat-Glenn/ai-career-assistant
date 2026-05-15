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
  /** Sources actually queried for this variant (RemoteOK omitted for non-tech). */
  selectedSources: string[];
};

/** Sources that may be configured for the app (not necessarily used for a given query). */
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
 * Source selection:
 * - Tech / cloud / software: RemoteOK + Adzuna (when configured).
 * - Non-tech: Adzuna only. RemoteOK is never used (tech-heavy remote feed).
 *   If Adzuna is not configured, returns an empty job list.
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

  if (!tech) {
    const selectedSources = adzunaOn ? ["adzuna"] : [];

    return {
      jobs: adzunaResults,
      fetchedPerSource,
      selectedSources,
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

  const selectedSources =
    adzunaOn ? (["remoteok", "adzuna"] as const) : (["remoteok"] as const);

  return {
    jobs: [...remoteOkResults, ...adzunaResults],
    fetchedPerSource,
    selectedSources: [...selectedSources],
  };
}

export { USER_AGENT };
