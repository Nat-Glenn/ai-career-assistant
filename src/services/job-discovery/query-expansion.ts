import { normalizeQueryPhrase } from "./query-match";

/** Cap variants per discovery run (primary + expansions). */
export const MAX_QUERY_VARIANTS = 8;

type ExpansionRule = {
  /** Case-insensitive normalized query substring / pattern match. */
  test: (normalizedQuery: string) => boolean;
  /** Alternate API search phrases (deduped with primary). Field-agnostic buckets. */
  phrases: string[];
};

/**
 * Ordered rules: earlier rows win exclusivity — first matching rule supplies expansions only from that bucket,
 * plus generic compaction fallback applies to everyone.
 */
const DOMAIN_EXPANSION_RULES: ExpansionRule[] = [
  {
    test: (q) =>
      /\baws\b/.test(q) ||
      /amazon\s+web\s+services/.test(q) ||
      (/\bcloud\b/.test(q) &&
        /\b(architect|architecture|solution)/.test(q)) ||
      /\bsolutions?\s+architect\b/.test(q),
    phrases: [
      "Cloud Engineer",
      "Solutions Architect",
      "Cloud Infrastructure Engineer",
      "AWS Engineer",
      "DevOps Engineer",
      "AWS Solutions Architect",
    ],
  },
  {
    test: (q) =>
      /\bcloud\b/.test(q) &&
      /\b(engineer|engineering|developer|dev)\b/.test(q),
    phrases: [
      "Cloud Infrastructure Engineer",
      "AWS Engineer",
      "Azure Engineer",
      "Platform Engineer",
      "Site Reliability Engineer",
      "DevOps Engineer",
    ],
  },
  {
    test: (q) =>
      /\bsoftware\b/.test(q) &&
      /\b(dev(eloper)?|engineer)\b/.test(q),
    phrases: [
      "Software Engineer",
      "Full Stack Developer",
      "Application Developer",
      "Software Developer",
    ],
  },
  {
    test: (q) =>
      /\bwarehouse\b/.test(q) ||
      /\bfulfillment\b/.test(q) ||
      /\bstocker\b/.test(q),
    phrases: [
      "Warehouse Associate",
      "Warehouse Worker",
      "Fulfillment Associate",
      "Inventory Clerk",
      "Distribution Center Associate",
    ],
  },
  {
    test: (q) =>
      /\bnurse\b/.test(q) ||
      /\brn\b/.test(q) ||
      /\bregistered\s+nurse\b/.test(q),
    phrases: [
      "Registered Nurse",
      "RN",
      "Staff Nurse",
      "Clinical Nurse",
      "Nursing",
    ],
  },
  {
    test: (q) =>
      /\bmarketing\b/.test(q) &&
      /\b(coordinator|specialist|associate)\b/.test(q),
    phrases: [
      "Marketing Coordinator",
      "Marketing Specialist",
      "Marketing Associate",
      "Digital Marketing Coordinator",
    ],
  },
  {
    test: (q) => /\bmarketing\b/.test(q),
    phrases: [
      "Marketing Specialist",
      "Marketing Coordinator",
      "Brand Marketing",
      "Growth Marketing",
    ],
  },
  {
    test: (q) =>
      /\baccounting\b/.test(q) ||
      /\baccountant\b/.test(q) ||
      /\bbookkeeper\b/.test(q) ||
      /\bcpa\b/.test(q),
    phrases: [
      "Staff Accountant",
      "Accounting Assistant",
      "Bookkeeper",
      "Accounting Clerk",
      "Junior Accountant",
    ],
  },
  {
    test: (q) =>
      /\bproject\s+manager\b/.test(q) ||
      /\bprogram\s+manager\b/.test(q),
    phrases: [
      "Program Manager",
      "Project Coordinator",
      "Technical Program Manager",
      "Scrum Master",
    ],
  },
];

function compactQueryFallback(trimmedPrimary: string): string | null {
  const q = normalizeQueryPhrase(trimmedPrimary);
  const parts = q.split(/\s+/).filter((w) => w.length >= 3);

  if (parts.length <= 1) {
    return null;
  }

  const compact = parts.join(" ");

  return compact !== q ? compact : null;
}

/**
 * Generates distinct search phrases for APIs (primary query first).
 * Keeps field-agnostic curated synonyms — expansions only broaden fetch; filtering still gates on intents.
 */
export function expandSearchQueries(primaryQuery: string): string[] {
  const trimmed = primaryQuery.trim();

  if (!trimmed) {
    return [];
  }

  const normalized = normalizeQueryPhrase(trimmed);
  const variants = new Set<string>();

  variants.add(trimmed);

  let matchedDomain = false;

  for (const rule of DOMAIN_EXPANSION_RULES) {
    if (rule.test(normalized)) {
      matchedDomain = true;

      for (const phrase of rule.phrases) {
        const p = phrase.trim();

        if (
          p &&
          normalizeQueryPhrase(p) !== normalized &&
          !variants.has(p)
        ) {
          variants.add(p);
        }
      }

      break;
    }
  }

  if (!matchedDomain) {
    const compact = compactQueryFallback(trimmed);

    if (compact) {
      variants.add(compact);
    }
  }

  return Array.from(variants).slice(0, MAX_QUERY_VARIANTS);
}
