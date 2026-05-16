import type { DiscoveredJob } from "@/types/job";

/**
 * JSearch / RapidAPI Jobs API — broad search API across many industries.
 * See: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * Usage notes:
 * - Requires RAPIDAPI_KEY in environment.
 * - One request per expanded discovery query.
 * - Server-side only; never expose RapidAPI keys to the browser.
 */

const DEFAULT_RAPIDAPI_HOST = "jsearch.p.rapidapi.com";
const RESULTS_PAGE = "1";
const NUM_PAGES = "1";

export type JSearchFetchOptions = {
  query: string;
  location?: string;
};

type JSearchRawJob = {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_logo?: string | null;
  job_publisher?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_description?: string;
  job_city?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_is_remote?: boolean;
  job_posted_at_timestamp?: number;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_required_skills?: string[] | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
};

type JSearchResponse = {
  data?: JSearchRawJob[];
};

export function isJSearchConfigured(): boolean {
  return Boolean(process.env.RAPIDAPI_KEY?.trim());
}

function buildQuery(options: JSearchFetchOptions): string {
  const query = options.query.trim();

  if (!options.location?.trim()) {
    return query;
  }

  return `${query} in ${options.location.trim()}`;
}

function buildLocation(row: JSearchRawJob): string | undefined {
  const pieces = [row.job_city, row.job_state, row.job_country]
    .map((piece) => piece?.trim())
    .filter((piece): piece is string => Boolean(piece));

  return pieces.length > 0 ? pieces.join(", ") : undefined;
}

function buildTags(row: JSearchRawJob): string[] | undefined {
  const tags = [
    row.job_publisher,
    row.job_employment_type,
    ...(row.job_required_skills ?? []),
  ]
    .map((tag) => tag?.trim())
    .filter((tag): tag is string => Boolean(tag));

  return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
}

function buildDescription(row: JSearchRawJob): string | undefined {
  const sections = [
    row.job_description,
    ...(row.job_highlights?.Qualifications ?? []),
    ...(row.job_highlights?.Responsibilities ?? []),
    ...(row.job_highlights?.Benefits ?? []),
  ]
    .map((text) => text?.trim())
    .filter((text): text is string => Boolean(text));

  return sections.length > 0
    ? Array.from(new Set(sections)).join("\n\n")
    : undefined;
}

function buildPostedAt(row: JSearchRawJob): string | undefined {
  if (row.job_posted_at_datetime_utc?.trim()) {
    const parsed = Date.parse(row.job_posted_at_datetime_utc);

    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  if (
    typeof row.job_posted_at_timestamp === "number" &&
    Number.isFinite(row.job_posted_at_timestamp)
  ) {
    const ms =
      row.job_posted_at_timestamp > 10_000_000_000
        ? row.job_posted_at_timestamp
        : row.job_posted_at_timestamp * 1000;

    return new Date(ms).toISOString();
  }

  return undefined;
}

function mapToDiscoveredJob(row: JSearchRawJob): DiscoveredJob | null {
  const id = row.job_id?.trim();
  const title = row.job_title?.trim();
  const url = row.job_apply_link?.trim() || row.job_google_link?.trim();

  if (!id || !title || !url?.startsWith("http")) {
    return null;
  }

  return {
    id: `jsearch-${id}`,
    title,
    company: row.employer_name?.trim() || "Unknown company",
    location: buildLocation(row),
    remote: Boolean(row.job_is_remote),
    source: "jsearch",
    sourceType: "api",
    url,
    description: buildDescription(row),
    tags: buildTags(row),
    postedAt: buildPostedAt(row),
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Searches JSearch for jobs matching a query. Returns [] when RapidAPI is not configured.
 */
export async function fetchJSearchJobs(
  options: JSearchFetchOptions,
): Promise<DiscoveredJob[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();

  if (!rapidApiKey) {
    return [];
  }

  const query = buildQuery(options);

  if (!query) {
    return [];
  }

  const host = process.env.JSEARCH_RAPIDAPI_HOST?.trim() || DEFAULT_RAPIDAPI_HOST;
  const params = new URLSearchParams({
    query,
    page: RESULTS_PAGE,
    num_pages: NUM_PAGES,
    date_posted: "month",
  });

  const response = await fetch(`https://${host}/search?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": host,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`JSearch API returned ${response.status}. Try again later.`);
  }

  const data = (await response.json()) as JSearchResponse;
  const rows = data.data ?? [];
  const jobs: DiscoveredJob[] = [];

  for (const row of rows) {
    const mapped = mapToDiscoveredJob(row);

    if (mapped) {
      jobs.push(mapped);
    }
  }

  return jobs;
}
