import { promises as fs } from "fs";
import path from "path";
import {
  discoveredJobListSchema,
  type DiscoveredJob,
} from "@/types/job";
import type { RemotePreference, UserProfile } from "@/types/profile";
import { getProfile } from "@/services/profile";
import { dedupeJobs, jobDedupeKey } from "./dedupe";
import { expandSearchQueries } from "./query-expansion";
import {
  detectStrictSearchDomain,
  passesStrictDomainSignals,
} from "./domain-relevance";
import { passesAnyIntentGate, isLikelyTechRoleQuery } from "./query-match";
import {
  scoreDiscoveryRanking,
  type ScoringPreferences,
} from "./scoring";
import {
  fetchJobsForDiscovery,
  getActiveJobSources,
  type FetchDiscoveryMemo,
} from "./sources";

/** MVP storage for aggregated job listings. */
const DATA_FILE = path.join(process.cwd(), "data", "jobs.json");

/** Cap results per discovery run to keep responses and storage reasonable. */
const MAX_RESULTS_PER_RUN = 50;

export type DiscoverJobsInput = {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  keywords?: string[];
  excludedKeywords?: string[];
  remotePreference?: RemotePreference;
};

export type ProfileDiscoveryReadiness = {
  ready: boolean;
  missing: string[];
};

export class ProfileIncompleteError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Profile is incomplete for discovery: ${missing.join(", ")}.`,
    );
    this.name = "ProfileIncompleteError";
    this.missing = missing;
  }
}

export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job not found: ${id}`);
    this.name = "JobNotFoundError";
  }
}

async function readJobs(): Promise<DiscoveredJob[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return discoveredJobListSchema.parse(JSON.parse(raw));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, "[]", "utf-8");
      return [];
    }

    throw error;
  }
}

async function writeJobs(jobs: DiscoveredJob[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

function filterJobs(
  jobs: DiscoveredJob[],
  input: DiscoverJobsInput,
  intentQueries: string[],
): DiscoveredJob[] {
  const excludedKeywords = input.excludedKeywords ?? [];
  const strictDomain = detectStrictSearchDomain(input.query);

  return jobs.filter((job) => {
    if (!passesAnyIntentGate(job, intentQueries)) {
      return false;
    }

    if (!passesStrictDomainSignals(job, strictDomain)) {
      return false;
    }

    if (input.remoteOnly && !job.remote) {
      return false;
    }

    if (
      input.remotePreference &&
      !matchesRemotePreference(job, input.remotePreference)
    ) {
      return false;
    }

    if (excludedKeywords.length > 0 && matchesExcludedKeywords(job, excludedKeywords)) {
      return false;
    }

    if (input.location?.trim()) {
      if (!matchesLocationFilter(job, input.location)) {
        return false;
      }
    }

    return true;
  });
}

function jobSearchText(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
): string {
  return [job.title, job.company, job.description ?? "", ...(job.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

function matchesExcludedKeywords(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  excludedKeywords: string[],
): boolean {
  const text = jobSearchText(job);

  return excludedKeywords.some((keyword) => {
    const normalized = keyword.toLowerCase().trim();
    return normalized.length > 0 && text.includes(normalized);
  });
}

function matchesRemotePreference(
  job: DiscoveredJob,
  preference: RemotePreference,
): boolean {
  if (preference === "remote" && !job.remote) {
    return false;
  }

  if (preference === "onsite" && job.remote) {
    return false;
  }

  return true;
}

/**
 * Location filter supports comma-separated places from the profile/UI (e.g.
 * "USA, Canada"). A job matches if its location contains any segment.
 */
function matchesLocationFilter(job: DiscoveredJob, locationFilter: string): boolean {
  const raw = locationFilter.trim().toLowerCase();

  if (!raw) {
    return true;
  }

  const segments = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return true;
  }

  const jobLocation = job.location?.toLowerCase() ?? "";

  if (!jobLocation.trim() && job.remote) {
    return true;
  }

  return segments.some((segment) => jobLocation.includes(segment));
}

function scoringFromProfile(
  profile: UserProfile,
  input: DiscoverJobsInput,
): ScoringPreferences {
  return {
    query: input.query,
    keywords: input.keywords,
    targetRoles: profile.targetRoles,
    coreSkills: profile.coreSkills,
    preferredKeywords: profile.preferredKeywords,
    experienceLevel: profile.experienceLevel,
    useProfileSignals: true,
  };
}

function logDiscoveryDebug(payload: {
  mode: "manual" | "profile";
  query: string;
  expandedQueries: string[];
  selectedSources: string[];
  fetchedPerSource: Record<string, number>;
  afterFilter: number;
  topTitles: string[];
}) {
  console.log(
    `[job-discovery] ${payload.mode} query=${JSON.stringify(payload.query)} expandedQueries=${JSON.stringify(payload.expandedQueries)} selectedSources=${JSON.stringify(payload.selectedSources)} fetchedPerSource=${JSON.stringify(payload.fetchedPerSource)} afterFilter=${payload.afterFilter} topTitles=${JSON.stringify(payload.topTitles)}`,
  );
}

/**
 * Whether the profile has enough data to run profile-based discovery.
 */
export function getProfileDiscoveryReadiness(
  profile: UserProfile,
): ProfileDiscoveryReadiness {
  const missing: string[] = [];

  if (profile.targetRoles.length === 0) {
    missing.push("target roles");
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}

const MAX_PROFILE_QUERY_RUNS = 12;

/**
 * Builds one or more discovery inputs from saved career preferences.
 */
export function buildDiscoveryQueriesFromProfile(
  profile: UserProfile,
): DiscoverJobsInput[] {
  const readiness = getProfileDiscoveryReadiness(profile);

  if (!readiness.ready) {
    return [];
  }

  const keywords = [...profile.coreSkills, ...profile.preferredKeywords];
  const remoteOnly = profile.remotePreference === "remote";
  const excludedKeywords = profile.excludedKeywords ?? [];
  const locations =
    profile.targetLocations.length > 0 ? profile.targetLocations : [undefined];

  const queries: DiscoverJobsInput[] = [];

  for (const role of profile.targetRoles) {
    for (const location of locations) {
      if (queries.length >= MAX_PROFILE_QUERY_RUNS) {
        break;
      }

      queries.push({
        query: role,
        location,
        remoteOnly,
        remotePreference: profile.remotePreference,
        keywords: keywords.length > 0 ? keywords : undefined,
        excludedKeywords:
          excludedKeywords.length > 0 ? excludedKeywords : undefined,
      });
    }

    if (queries.length >= MAX_PROFILE_QUERY_RUNS) {
      break;
    }
  }

  return queries;
}

function balanceSources(
  sortedJobs: DiscoveredJob[],
  limit: number,
  preferBalanceNonTech: boolean,
): DiscoveredJob[] {
  if (!preferBalanceNonTech || sortedJobs.length <= 2) {
    return sortedJobs.slice(0, limit);
  }

  const adzuna = sortedJobs.filter((job) => job.source === "adzuna");
  const other = sortedJobs.filter((job) => job.source !== "adzuna");

  if (adzuna.length === 0 || other.length === 0) {
    return sortedJobs.slice(0, limit);
  }

  const merged: DiscoveredJob[] = [];
  let pickAdzuna = true;
  let i = 0;
  let j = 0;

  while (
    merged.length < limit &&
    (i < adzuna.length || j < other.length)
  ) {
    if (pickAdzuna && i < adzuna.length) {
      merged.push(adzuna[i]);
      i++;
    } else if (!pickAdzuna && j < other.length) {
      merged.push(other[j]);
      j++;
    } else if (i < adzuna.length) {
      merged.push(adzuna[i]);
      i++;
    } else if (j < other.length) {
      merged.push(other[j]);
      j++;
    }

    pickAdzuna = !pickAdzuna;
  }

  return merged;
}

async function fetchExpandedJobsAggregated(
  input: DiscoverJobsInput,
  memo?: FetchDiscoveryMemo,
): Promise<{
  merged: DiscoveredJob[];
  aggregatedFetchedPerSource: Record<string, number>;
  selectedSources: string[];
}> {
  const variants = expandSearchQueries(input.query);
  const aggregatedFetchedPerSource: Record<string, number> = {};
  const selectedSourcesAcc = new Set<string>();
  const merged: DiscoveredJob[] = [];
  const seenKeys = new Set<string>();

  for (const variant of variants) {
    const { jobs, fetchedPerSource, selectedSources } =
      await fetchJobsForDiscovery(
        {
          query: variant,
          location: input.location,
        },
        memo,
      );

    for (const s of selectedSources) {
      selectedSourcesAcc.add(s);
    }

    for (const [source, count] of Object.entries(fetchedPerSource)) {
      aggregatedFetchedPerSource[source] =
        (aggregatedFetchedPerSource[source] ?? 0) + count;
    }

    for (const job of jobs) {
      const key = jobDedupeKey(job);

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        merged.push(job);
      }
    }
  }

  return {
    merged,
    aggregatedFetchedPerSource,
    selectedSources: Array.from(selectedSourcesAcc),
  };
}

async function scoreAndRankJobs(
  jobs: DiscoveredJob[],
  scoring: ScoringPreferences,
  expandedQueriesForOverlap: string[],
): Promise<DiscoveredJob[]> {
  const scored = jobs.map((job) => {
    const ranked = scoreDiscoveryRanking(job, scoring, expandedQueriesForOverlap);

    return {
      ...job,
      relevanceScore: ranked.relevanceScore,
      freshnessScore: ranked.freshnessScore,
      discoveredAt: new Date().toISOString(),
    };
  });

  scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return scored;
}

async function persistDiscoveredJobs(
  newJobs: DiscoveredJob[],
): Promise<DiscoveredJob[]> {
  const topResults = newJobs.slice(0, MAX_RESULTS_PER_RUN);
  const existing = await readJobs();
  const merged = dedupeJobs([...existing, ...topResults]);

  merged.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return (
      new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    );
  });

  await writeJobs(merged);

  return topResults;
}

/**
 * Returns all jobs stored in data/jobs.json, sorted by relevance then date.
 */
export async function getDiscoveredJob(id: string): Promise<DiscoveredJob> {
  const jobs = await readJobs();
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    throw new JobNotFoundError(id);
  }

  return job;
}

/**
 * Lists jobs from storage. Without a search scope, sorts by newest first so
 * stale relevance scores from older searches do not bury recent results.
 * With filters, applies the same rules as discovery (incl. remote / location)
 * and re-scores for the current query so ranking matches what you searched.
 */
export async function listDiscoveredJobs(
  filters?: DiscoverJobsInput | null,
): Promise<DiscoveredJob[]> {
  const jobs = await readJobs();

  if (!filters?.query?.trim()) {
    return [...jobs].sort(
      (a, b) =>
        new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime(),
    );
  }

  const intents = expandSearchQueries(filters.query);

  const filtered = filterJobs(jobs, filters, intents);

  const expandedQueriesForOverlap = intents.slice(1);

  const scoring: ScoringPreferences = {
    query: filters.query,
    keywords: filters.keywords,
    useProfileSignals: false,
  };

  const rescored = filtered.map((job) => {
    const ranked = scoreDiscoveryRanking(
      job,
      scoring,
      expandedQueriesForOverlap,
    );

    return {
      ...job,
      relevanceScore: ranked.relevanceScore,
      freshnessScore: ranked.freshnessScore,
    };
  });

  rescored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return rescored;
}

/**
 * Fetches from public sources, filters, scores, dedupes, and persists jobs.
 */
export async function discoverJobs(
  input: DiscoverJobsInput,
): Promise<DiscoveredJob[]> {
  const intents = expandSearchQueries(input.query);

  const memo: FetchDiscoveryMemo = {};

  const {
    merged,
    aggregatedFetchedPerSource,
    selectedSources,
  } = await fetchExpandedJobsAggregated(input, memo);

  const filtered = filterJobs(merged, input, intents);

  const expandedQueriesForOverlap = intents.slice(1);

  const scored = await scoreAndRankJobs(filtered, {
    query: input.query,
    keywords: input.keywords,
    useProfileSignals: false,
  }, expandedQueriesForOverlap);

  const preferBalance = !isLikelyTechRoleQuery(input.query);

  const balanced = balanceSources(scored, MAX_RESULTS_PER_RUN, preferBalance);

  logDiscoveryDebug({
    mode: "manual",
    query: input.query,
    expandedQueries: intents,
    selectedSources,
    fetchedPerSource: aggregatedFetchedPerSource,
    afterFilter: filtered.length,
    topTitles: balanced.slice(0, 10).map((job) => job.title),
  });

  return persistDiscoveredJobs(balanced);
}

export type DiscoverJobsFromProfileResult = {
  jobs: DiscoveredJob[];
  meta: {
    count: number;
    queriesRun: number;
    roles: string[];
    sources: string[];
  };
};

/**
 * Loads the saved profile, runs discovery for each target role (and locations),
 * merges and dedupes results, then persists to data/jobs.json.
 */
export async function discoverJobsFromProfile(): Promise<DiscoverJobsFromProfileResult> {
  const profile = await getProfile();
  const readiness = getProfileDiscoveryReadiness(profile);

  if (!readiness.ready) {
    throw new ProfileIncompleteError(readiness.missing);
  }

  const queries = buildDiscoveryQueriesFromProfile(profile);
  const combined: DiscoveredJob[] = [];
  const memo: FetchDiscoveryMemo = {};
  const profileSelectedSources = new Set<string>();

  for (const input of queries) {
    const intents = expandSearchQueries(input.query);

    const {
      merged,
      aggregatedFetchedPerSource,
      selectedSources,
    } = await fetchExpandedJobsAggregated(input, memo);

    for (const s of selectedSources) {
      profileSelectedSources.add(s);
    }

    const filtered = filterJobs(merged, input, intents);

    const expandedQueriesForOverlap = intents.slice(1);

    const scored = await scoreAndRankJobs(
      filtered,
      scoringFromProfile(profile, input),
      expandedQueriesForOverlap,
    );

    const preferBalance = !isLikelyTechRoleQuery(input.query);

    const balanced = balanceSources(scored, MAX_RESULTS_PER_RUN, preferBalance);

    logDiscoveryDebug({
      mode: "profile",
      query: input.query,
      expandedQueries: intents,
      selectedSources,
      fetchedPerSource: aggregatedFetchedPerSource,
      afterFilter: filtered.length,
      topTitles: balanced.slice(0, 10).map((job) => job.title),
    });

    combined.push(...balanced);
  }

  const deduped = dedupeJobs(combined);
  deduped.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  const jobs = await persistDiscoveredJobs(deduped);

  const sourcesMeta =
    profileSelectedSources.size > 0
      ? Array.from(profileSelectedSources)
      : getActiveJobSources();

  return {
    jobs,
    meta: {
      count: jobs.length,
      queriesRun: queries.length,
      roles: profile.targetRoles,
      sources: sourcesMeta,
    },
  };
}

export { getActiveJobSources };
