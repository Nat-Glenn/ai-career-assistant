import type { DiscoveredJob } from "@/types/job";

/**
 * RemoteOK public API — official JSON feed of remote job listings.
 * See: https://remoteok.com/api
 *
 * Usage notes (respectful aggregation):
 * - Single GET request per discovery run (no aggressive polling)
 * - Identify the client with a descriptive User-Agent
 * - Filter client-side; do not hammer the API
 */

const REMOTEOK_API_URL = "https://remoteok.com/api";

const USER_AGENT =
  "AI-Career-Assistant/1.0 (portfolio; educational job aggregation)";

type RemoteOkRawJob = {
  id?: string | number;
  slug?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  tags?: string[];
  url?: string;
  /** Unix timestamp (seconds) when listing was posted */
  epoch?: number;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildJobUrl(job: RemoteOkRawJob): string | null {
  if (job.url && job.url.startsWith("http")) {
    return job.url;
  }

  if (job.slug) {
    return `https://remoteok.com/remote-jobs/${job.slug}`;
  }

  if (job.id !== undefined) {
    return `https://remoteok.com/l/${job.id}`;
  }

  return null;
}

function isRemoteOkJobRow(item: unknown): item is RemoteOkRawJob {
  if (!item || typeof item !== "object") {
    return false;
  }

  const row = item as RemoteOkRawJob;

  return (
    row.id !== undefined &&
    typeof row.position === "string" &&
    typeof row.company === "string"
  );
}

function mapToDiscoveredJob(row: RemoteOkRawJob): DiscoveredJob | null {
  const url = buildJobUrl(row);

  if (!url) {
    return null;
  }

  const description = row.description ? stripHtml(row.description) : undefined;

  let postedAt: string | undefined;

  if (typeof row.epoch === "number" && Number.isFinite(row.epoch)) {
    const ms =
      row.epoch > 10_000_000_000 ? row.epoch : row.epoch * 1000;
    postedAt = new Date(ms).toISOString();
  }

  return {
    id: `remoteok-${row.id}`,
    title: row.position!.trim(),
    company: row.company!.trim(),
    location: row.location?.trim() || undefined,
    remote: true,
    source: "remoteok",
    url,
    description,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    postedAt,
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Fetches remote jobs from the official RemoteOK JSON API.
 */
export async function fetchRemoteOkJobs(): Promise<DiscoveredJob[]> {
  const response = await fetch(REMOTEOK_API_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `RemoteOK API returned ${response.status}. Try again later.`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("RemoteOK API returned an unexpected response format.");
  }

  const jobs: DiscoveredJob[] = [];

  for (const item of data) {
    if (!isRemoteOkJobRow(item)) {
      continue;
    }

    const mapped = mapToDiscoveredJob(item);

    if (mapped) {
      jobs.push(mapped);
    }
  }

  return jobs;
}
