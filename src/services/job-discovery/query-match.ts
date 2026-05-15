import type { DiscoveredJob } from "@/types/job";

/** Stop words dropped when tokenizing queries for matching (field-agnostic). */
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "per",
  "the",
  "to",
  "with",
]);

export function normalizeQueryPhrase(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenizeQuery(raw: string): string[] {
  const normalized = normalizeQueryPhrase(raw);

  return normalized
    .split(/\s+/)
    .map((t) => t.replace(/[^\w+/\-]/g, ""))
    .filter((t) => t.length > 0);
}

/** Tokens used for relevance gating (query intent must appear in the job text). */
export function meaningfulQueryTokens(raw: string): string[] {
  const tokens = tokenizeQuery(raw).filter((t) => !STOP_WORDS.has(t));

  if (tokens.length > 0) {
    return tokens;
  }

  return tokenizeQuery(raw).filter((t) => t.length >= 2);
}

export function jobFullText(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
): string {
  return [job.title, job.company, job.description ?? "", ...(job.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

/** Lightweight plural/stem-style match without NLP libs. */
export function textMatchesTerm(text: string, term: string): boolean {
  const t = term.toLowerCase();

  if (!t || text.length === 0) {
    return false;
  }

  if (text.includes(t)) {
    return true;
  }

  if (t.length >= 4 && t.endsWith("s") && !t.endsWith("ss")) {
    const singular = t.slice(0, -1);

    if (text.includes(singular)) {
      return true;
    }
  }

  if (t.length >= 5 && t.endsWith("es")) {
    const stem = t.slice(0, -2);

    if (stem.length >= 3 && text.includes(stem)) {
      return true;
    }
  }

  return false;
}

/**
 * Manual search gate: unrelated listings are excluded unless they clearly relate
 * to the user's query (phrase or majority of meaningful tokens in job text).
 */
export function passesQueryRelevanceGate(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  rawQuery: string,
): boolean {
  const phrase = normalizeQueryPhrase(rawQuery);

  if (!phrase) {
    return true;
  }

  const text = jobFullText(job);

  if (text.includes(phrase)) {
    return true;
  }

  const tokens = meaningfulQueryTokens(rawQuery);

  if (tokens.length === 0) {
    return true;
  }

  const matched = tokens.filter((tok) => textMatchesTerm(text, tok)).length;

  const needed = Math.max(1, Math.round(tokens.length * 0.58));

  return matched >= needed;
}

/**
 * Strong inclusion gate: job must align with at least one intent phrase (primary + curated expansions).
 */
export function passesAnyIntentGate(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  intentQueries: string[],
): boolean {
  const intents = intentQueries.map((q) => q.trim()).filter(Boolean);

  if (intents.length === 0) {
    return true;
  }

  return intents.some((intent) => passesQueryRelevanceGate(job, intent));
}

/**
 * RemoteOK skews heavily toward remote tech — skip bulk ingest for clearly
 * non-tech queries when Adzuna can serve broader industries instead.
 */
export function isLikelyTechRoleQuery(rawQuery: string): boolean {
  const q = normalizeQueryPhrase(rawQuery);

  if (!q) {
    return false;
  }

  const techPattern =
    /\b(software|developer|programmer|devops|frontend|front-end|backend|back-end|full[\s-]?stack|typescript|javascript|\breact\b|\bnode\b|\bvue\b|\bjava\b|\bruby\b|\bgolang\b|\bkubernetes\b|\bk8s\b|\baws\b|\bazure\b|\bgcp\b|\bsre\b|site\s+reliability|data\s+scientist|data\s+engineer|machine\s+learning|\bmachine\b|\bnlp\b|\bllm\b|\bios\b|\bandroid\b|mobile\s+developer|qa\s+engineer|test\s+automation|security\s+engineer|cyber\s?security|cloud\s+engineer|platform\s+engineer|infra(structure)?\s+engineer|embedded\s+engineer|python\s+(developer|engineer)|scala\s+(developer|engineer))\b/i;

  if (techPattern.test(q)) {
    return true;
  }

  if (/\b(engineer|engineering)\b/i.test(q)) {
    const nonTechEngineering =
      /\b(civil|mechanical|electrical|structural|chemical|industrial|biomedical|hvac|automotive|aerospace|mining|petroleum)\b/i;

    if (nonTechEngineering.test(q)) {
      return false;
    }

    return true;
  }

  return false;
}
