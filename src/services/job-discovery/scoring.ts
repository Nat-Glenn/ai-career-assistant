import type { DiscoveredJob } from "@/types/job";

export type ScoringPreferences = {
  query: string;
  keywords?: string[];
};

function buildSearchText(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
): string {
  const parts = [
    job.title,
    job.company,
    job.description ?? "",
    ...(job.tags ?? []),
  ];

  return parts.join(" ").toLowerCase();
}

/**
 * Simple relevance score (0–100) from query terms and optional keywords.
 * Not ML-based — fast, explainable, and good enough for MVP ranking.
 */
export function scoreJob(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  preferences: ScoringPreferences,
): number {
  const text = buildSearchText(job);
  let score = 0;

  const queryTerms = preferences.query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  for (const term of queryTerms) {
    if (text.includes(term)) {
      score += 12;
    }
  }

  for (const keyword of preferences.keywords ?? []) {
    const normalized = keyword.toLowerCase().trim();
    if (normalized && text.includes(normalized)) {
      score += 18;
    }
  }

  return Math.min(100, score);
}
