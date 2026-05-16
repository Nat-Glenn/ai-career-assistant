import type { DiscoveredJob } from "@/types/job";

/**
 * Adzuna Jobs API — official search API (requires free developer keys).
 * See: https://developer.adzuna.com/overview
 *
 * Usage notes:
 * - One search request per discovery query (not bulk scraping)
 * - Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in environment
 * - Country code via ADZUNA_COUNTRY (default: us)
 */

const USER_AGENT =
  "AI-Career-Assistant/1.0 (portfolio; educational job aggregation)";

const DEFAULT_COUNTRY = "us";
const RESULTS_PER_PAGE = 50;

export type AdzunaFetchOptions = {
  query: string;
  location?: string;
};

type AdzunaRawJob = {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  category?: { label?: string };
  /** Listing creation time when returned by API (often ISO-like string). */
  created?: string;
};

type AdzunaSearchResponse = {
  results?: AdzunaRawJob[];
};

export function isAdzunaConfigured(): boolean {
  return Boolean(
    process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim(),
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferRemote(job: AdzunaRawJob): boolean {
  const text = [
    job.location?.display_name,
    job.title,
    job.description ? stripHtml(job.description) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh")
  );
}

function buildLocation(job: AdzunaRawJob): string | undefined {
  if (job.location?.display_name?.trim()) {
    return job.location.display_name.trim();
  }

  if (job.location?.area?.length) {
    return job.location.area.join(", ");
  }

  return undefined;
}

function mapToDiscoveredJob(row: AdzunaRawJob): DiscoveredJob | null {
  if (!row.id || !row.title?.trim() || !row.redirect_url?.startsWith("http")) {
    return null;
  }

  const company = row.company?.display_name?.trim() || "Unknown company";
  const description = row.description ? stripHtml(row.description) : undefined;
  const tags = row.category?.label ? [row.category.label] : undefined;

  let postedAt: string | undefined;

  if (row.created?.trim()) {
    const parsed = Date.parse(row.created);

    if (!Number.isNaN(parsed)) {
      postedAt = new Date(parsed).toISOString();
    }
  }

  return {
    id: `adzuna-${row.id}`,
    title: row.title.trim(),
    company,
    location: buildLocation(row),
    remote: inferRemote(row),
    source: "adzuna",
    sourceType: "api",
    url: row.redirect_url,
    description,
    tags,
    postedAt,
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Searches Adzuna for jobs matching the query. Returns [] when API keys are not set.
 */
export async function fetchAdzunaJobs(
  options: AdzunaFetchOptions,
): Promise<DiscoveredJob[]> {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();

  if (!appId || !appKey) {
    return [];
  }

  const query = options.query.trim();

  if (!query) {
    return [];
  }

  const country = process.env.ADZUNA_COUNTRY?.trim().toLowerCase() || DEFAULT_COUNTRY;
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(RESULTS_PER_PAGE),
    what: query,
    "content-type": "application/json",
  });

  if (options.location?.trim()) {
    params.set("where", options.location.trim());
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Adzuna API returned ${response.status}. Try again later.`);
  }

  const data = (await response.json()) as AdzunaSearchResponse;
  const results = data.results ?? [];
  const jobs: DiscoveredJob[] = [];

  for (const row of results) {
    const mapped = mapToDiscoveredJob(row);

    if (mapped) {
      jobs.push(mapped);
    }
  }

  return jobs;
}
