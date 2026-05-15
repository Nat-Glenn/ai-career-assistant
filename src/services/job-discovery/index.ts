import { promises as fs } from "fs";
import path from "path";
import {
  discoveredJobListSchema,
  type DiscoveredJob,
} from "@/types/job";
import type { RemotePreference, UserProfile } from "@/types/profile";
import { getProfile } from "@/services/profile";
import { dedupeJobs } from "./dedupe";
import { scoreJob, type ScoringPreferences } from "./scoring";
import { fetchRemoteOkJobs } from "./sources/remoteok";

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

function matchesSearchText(job: DiscoveredJob, terms: string[]): boolean {
  const text = [
    job.title,
    job.company,
    job.description ?? "",
    ...(job.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => text.includes(term));
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

function filterJobs(
  jobs: DiscoveredJob[],
  input: DiscoverJobsInput,
): DiscoveredJob[] {
  const queryTerms = input.query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  const keywordTerms =
    input.keywords?.map((kw) => kw.toLowerCase().trim()).filter(Boolean) ?? [];

  const searchTerms = [...new Set([...queryTerms, ...keywordTerms])];
  const excludedKeywords = input.excludedKeywords ?? [];

  return jobs.filter((job) => {
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
      const locationNeedle = input.location.trim().toLowerCase();
      const jobLocation = job.location?.toLowerCase() ?? "";

      if (!jobLocation.includes(locationNeedle)) {
        return false;
      }
    }

    if (searchTerms.length === 0) {
      return true;
    }

    return matchesSearchText(job, searchTerms);
  });
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
  };
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

async function scoreAndRankJobs(
  jobs: DiscoveredJob[],
  scoring: ScoringPreferences,
): Promise<DiscoveredJob[]> {
  const scored = jobs.map((job) => ({
    ...job,
    relevanceScore: scoreJob(job, scoring),
    discoveredAt: new Date().toISOString(),
  }));

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

export async function listDiscoveredJobs(): Promise<DiscoveredJob[]> {
  const jobs = await readJobs();

  return jobs.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return (
      new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    );
  });
}

/**
 * Fetches from public sources, filters, scores, dedupes, and persists jobs.
 */
export async function discoverJobs(
  input: DiscoverJobsInput,
): Promise<DiscoveredJob[]> {
  const fetched = await fetchRemoteOkJobs();
  const filtered = filterJobs(fetched, input);
  const scored = await scoreAndRankJobs(filtered, {
    query: input.query,
    keywords: input.keywords,
  });

  return persistDiscoveredJobs(scored);
}

export type DiscoverJobsFromProfileResult = {
  jobs: DiscoveredJob[];
  meta: {
    count: number;
    queriesRun: number;
    roles: string[];
    source: string;
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
  const fetched = await fetchRemoteOkJobs();
  const combined: DiscoveredJob[] = [];

  for (const input of queries) {
    const filtered = filterJobs(fetched, input);
    const scored = await scoreAndRankJobs(
      filtered,
      scoringFromProfile(profile, input),
    );
    combined.push(...scored);
  }

  const deduped = dedupeJobs(combined);
  deduped.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  const jobs = await persistDiscoveredJobs(deduped);

  return {
    jobs,
    meta: {
      count: jobs.length,
      queriesRun: queries.length,
      roles: profile.targetRoles,
      source: "remoteok",
    },
  };
}
