import { z } from "zod";

/**
 * Discovered job listing stored in data/jobs.json (MVP).
 */
export const discoveredJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  remote: z.boolean(),
  source: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  /** Original listing publish time when the source exposes it (ISO 8601). */
  postedAt: z.string().optional(),
  /** Normalized freshness (0–100), computed when ranking if postedAt exists. */
  freshnessScore: z.number().min(0).max(100).optional(),
  discoveredAt: z.string(),
});

export type DiscoveredJob = z.infer<typeof discoveredJobSchema>;

export const discoveredJobListSchema = z.array(discoveredJobSchema);
