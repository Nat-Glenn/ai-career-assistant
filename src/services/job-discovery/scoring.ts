import type { DiscoveredJob } from "@/types/job";
import type { ExperienceLevel } from "@/types/profile";
import {
  jobFullText,
  meaningfulQueryTokens,
  normalizeQueryPhrase,
  textMatchesTerm,
} from "./query-match";

export type ScoringPreferences = {
  query: string;
  keywords?: string[];
  targetRoles?: string[];
  coreSkills?: string[];
  preferredKeywords?: string[];
  experienceLevel?: ExperienceLevel;
  useProfileSignals?: boolean;
};

const EXPERIENCE_TERMS: Record<ExperienceLevel, string[]> = {
  internship: ["intern", "internship", "co-op"],
  entry: ["entry", "entry-level", "graduate", "new grad"],
  junior: ["junior", "jr"],
  intermediate: ["mid", "intermediate", "ii"],
  senior: ["senior", "sr", "lead", "principal", "staff"],
};

/**
 * Maps posting age to 0–100 (newer listings score higher).
 */
export function computeFreshnessScore(postedAt?: string): number | undefined {
  if (!postedAt?.trim()) {
    return undefined;
  }

  const parsed = Date.parse(postedAt);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  const ageDays = (Date.now() - parsed) / 86_400_000;

  if (ageDays <= 3) {
    return 100;
  }

  if (ageDays <= 7) {
    return 88;
  }

  if (ageDays <= 14) {
    return 74;
  }

  if (ageDays <= 30) {
    return 58;
  }

  if (ageDays <= 45) {
    return 42;
  }

  return 28;
}

/**
 * Query-first textual relevance (uncapped raw basis — combined later).
 */
export function scoreJobTextMatch(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  preferences: ScoringPreferences,
): number {
  const fullText = jobFullText(job);
  const titleLower = job.title.toLowerCase();
  const phrase = normalizeQueryPhrase(preferences.query);

  let score = 0;

  if (phrase) {
    if (titleLower.includes(phrase)) {
      score += 56;
    } else if (fullText.includes(phrase)) {
      score += 36;
    }

    const tokens = meaningfulQueryTokens(preferences.query);

    for (const tok of tokens) {
      if (textMatchesTerm(titleLower, tok)) {
        score += 15;
      } else if (textMatchesTerm(fullText, tok)) {
        score += 8;
      }
    }
  }

  const keywordList = preferences.keywords ?? [];

  for (const keyword of keywordList) {
    const normalized = keyword.toLowerCase().trim();

    if (!normalized) {
      continue;
    }

    if (titleLower.includes(normalized)) {
      score += 7;
    } else if (fullText.includes(normalized)) {
      score += 4;
    }
  }

  if (preferences.useProfileSignals !== false) {
    const keywordTerms = [
      ...(preferences.coreSkills ?? []),
      ...(preferences.preferredKeywords ?? []),
    ];

    for (const keyword of keywordTerms) {
      const normalized = keyword.toLowerCase().trim();

      if (normalized && fullText.includes(normalized)) {
        score += 5;
      }
    }

    for (const role of preferences.targetRoles ?? []) {
      const normalized = role.toLowerCase().trim();

      if (normalized && fullText.includes(normalized)) {
        score += 4;
      }
    }

    if (preferences.experienceLevel) {
      const terms = EXPERIENCE_TERMS[preferences.experienceLevel];

      if (terms.some((term) => fullText.includes(term))) {
        score += 5;
      }
    }
  }

  return score;
}

function expandedPhraseOverlapBonus(
  titleLower: string,
  expandedQueries: string[],
): number {
  let bonus = 0;

  for (const eq of expandedQueries) {
    const phrase = normalizeQueryPhrase(eq);

    if (phrase && titleLower.includes(phrase)) {
      bonus += 6;
    }
  }

  return Math.min(16, bonus);
}

function titleQueryTokenOverlap(jobTitle: string, query: string): number {
  const qt = meaningfulQueryTokens(query);

  if (qt.length === 0) {
    return 0;
  }

  let hits = 0;
  const tl = jobTitle.toLowerCase();

  for (const tok of qt) {
    if (textMatchesTerm(tl, tok)) {
      hits++;
    }
  }

  const ratio = hits / qt.length;

  return Math.round(ratio * 16);
}

/**
 * Final discovery ranking: exact / token matches, curated expansion overlap,
 * keywords (lighter), freshness when postedAt exists.
 */
export function scoreDiscoveryRanking(
  job: DiscoveredJob,
  preferences: ScoringPreferences,
  expandedQueries: string[],
): { relevanceScore: number; freshnessScore?: number } {
  const rawText = scoreJobTextMatch(job, preferences);
  const freshnessScore = computeFreshnessScore(job.postedAt);

  const freshnessWeighted =
    freshnessScore !== undefined
      ? Math.round((freshnessScore / 100) * 22)
      : 9;

  const titleLower = job.title.toLowerCase();
  const expansionBonus = expandedPhraseOverlapBonus(titleLower, expandedQueries);
  const roleOverlap = titleQueryTokenOverlap(job.title, preferences.query);

  const blended = Math.min(
    100,
    Math.round(
      rawText * 0.58 +
        freshnessWeighted +
        expansionBonus +
        roleOverlap,
    ),
  );

  return {
    relevanceScore: blended,
    freshnessScore,
  };
}

/** Back-compat alias used by listing-only rescoring paths. */
export function scoreJob(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  preferences: ScoringPreferences,
): number {
  return Math.min(100, scoreJobTextMatch(job, preferences));
}
