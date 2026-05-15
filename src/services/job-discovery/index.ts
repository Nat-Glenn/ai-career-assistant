import { promises as fs } from "fs";
import path from "path";
import {
  discoveredJobListSchema,
  type DiscoveredJob,
} from "@/types/job";
import { dedupeJobs } from "./dedupe";
import { scoreJob } from "./scoring";
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
};

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

  return jobs.filter((job) => {
    if (input.remoteOnly && !job.remote) {
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

  const scored = filtered.map((job) => ({
    ...job,
    relevanceScore: scoreJob(job, {
      query: input.query,
      keywords: input.keywords,
    }),
    discoveredAt: new Date().toISOString(),
  }));

  scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  const topResults = scored.slice(0, MAX_RESULTS_PER_RUN);
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
