import type { DiscoveredJob } from "@/types/job";
import { isLikelyTechRoleQuery } from "../query-match";
import { fetchAdzunaJobs, isAdzunaConfigured } from "./adzuna";
import { fetchJSearchJobs, isJSearchConfigured } from "./jsearch";
import { fetchRemoteOkJobs } from "./remoteok";

const USER_AGENT =
  "AI-Career-Assistant/1.0 (portfolio; educational job aggregation)";

export type JobSourceFetchOptions = {
  query: string;
  location?: string;
  /** Optional primary query used for source selection across expanded variants. */
  sourceQuery?: string;
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

  if (isJSearchConfigured()) {
    sources.push("jsearch");
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
  const [adzuna, jsearch] = await Promise.all([
    isAdzunaConfigured()
      ? safeFetchSource("adzuna", () =>
          fetchAdzunaJobs({
            query: options.query,
            location: options.location,
          }),
        )
      : Promise.resolve([]),
    isJSearchConfigured()
      ? safeFetchSource("jsearch", () =>
          fetchJSearchJobs({
            query: options.query,
            location: options.location,
          }),
        )
      : Promise.resolve([]),
  ]);

  return [...adzuna, ...jsearch];
}

export type FetchDiscoveryMemo = {
  remoteOkBulk?: DiscoveredJob[];
};

/**
 * Source selection:
 * - Tech / cloud / software: RemoteOK + configured broad search APIs.
 * - Non-tech: configured broad search APIs only. RemoteOK is never used
 *   for non-tech because the feed is heavily remote/tech skewed.
 */
export async function fetchJobsForDiscovery(
  options: JobSourceFetchOptions,
  memo?: FetchDiscoveryMemo,
): Promise<FetchDiscoverySourcesResult> {
  const tech = isLikelyTechRoleQuery(options.sourceQuery ?? options.query);
  const adzunaOn = isAdzunaConfigured();
  const jsearchOn = isJSearchConfigured();

  const fetchedPerSource: Record<string, number> = {};
  const selectedSources = new Set<string>();

  const [adzunaResults, jsearchResults] = await Promise.all([
    adzunaOn
      ? safeFetchSource("adzuna", () =>
          fetchAdzunaJobs({
            query: options.query,
            location: options.location,
          }),
        )
      : Promise.resolve([]),
    jsearchOn
      ? safeFetchSource("jsearch", () =>
          fetchJSearchJobs({
            query: options.query,
            location: options.location,
          }),
        )
      : Promise.resolve([]),
  ]);

  if (adzunaOn) {
    fetchedPerSource.adzuna = adzunaResults.length;
    selectedSources.add("adzuna");
  }

  if (jsearchOn) {
    fetchedPerSource.jsearch = jsearchResults.length;
    selectedSources.add("jsearch");
  }

  if (!tech) {
    return {
      jobs: [...adzunaResults, ...jsearchResults],
      fetchedPerSource,
      selectedSources: Array.from(selectedSources),
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
  selectedSources.add("remoteok");

  return {
    jobs: [...remoteOkResults, ...adzunaResults, ...jsearchResults],
    fetchedPerSource,
    selectedSources: Array.from(selectedSources),
  };
}

export { USER_AGENT };
