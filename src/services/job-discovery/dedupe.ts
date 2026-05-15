import type { DiscoveredJob } from "@/types/job";

/**
 * Normalized key for deduplicating jobs across sources and sync runs.
 * Uses URL, title, and company so near-duplicates collapse to one record.
 */
export function jobDedupeKey(job: Pick<DiscoveredJob, "url" | "title" | "company">): string {
  const url = job.url.toLowerCase().replace(/\/$/, "");
  const title = job.title.toLowerCase().trim();
  const company = job.company.toLowerCase().trim();

  return `${url}|${title}|${company}`;
}

/**
 * Deduplicates jobs, keeping the entry with the higher relevance score.
 */
export function dedupeJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const byKey = new Map<string, DiscoveredJob>();

  for (const job of jobs) {
    const key = jobDedupeKey(job);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, job);
      continue;
    }

    const existingScore = existing.relevanceScore ?? 0;
    const jobScore = job.relevanceScore ?? 0;

    if (jobScore >= existingScore) {
      byKey.set(key, job);
    }
  }

  return Array.from(byKey.values());
}
