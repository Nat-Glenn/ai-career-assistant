import type { DiscoveredJob } from "@/types/job";
import type { ExperienceLevel } from "@/types/profile";

export type ScoringPreferences = {
  query: string;
  keywords?: string[];
  targetRoles?: string[];
  coreSkills?: string[];
  preferredKeywords?: string[];
  experienceLevel?: ExperienceLevel;
};

const EXPERIENCE_TERMS: Record<ExperienceLevel, string[]> = {
  internship: ["intern", "internship", "co-op"],
  entry: ["entry", "entry-level", "graduate", "new grad"],
  junior: ["junior", "jr"],
  intermediate: ["mid", "intermediate", "ii"],
  senior: ["senior", "sr", "lead", "principal", "staff"],
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

  const keywordTerms = [
    ...(preferences.keywords ?? []),
    ...(preferences.coreSkills ?? []),
    ...(preferences.preferredKeywords ?? []),
  ];

  for (const keyword of keywordTerms) {
    const normalized = keyword.toLowerCase().trim();
    if (normalized && text.includes(normalized)) {
      score += 18;
    }
  }

  for (const role of preferences.targetRoles ?? []) {
    const normalized = role.toLowerCase().trim();
    if (normalized && text.includes(normalized)) {
      score += 10;
    }
  }

  if (preferences.experienceLevel) {
    const terms = EXPERIENCE_TERMS[preferences.experienceLevel];
    if (terms.some((term) => text.includes(term))) {
      score += 8;
    }
  }

  return Math.min(100, score);
}
