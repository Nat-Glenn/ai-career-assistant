import { z } from "zod";

/** One resume bullet rewritten for a specific job. */
export const rewrittenBulletSchema = z.object({
  original: z.string(),
  rewritten: z.string(),
});

/**
 * Structured resume tailoring result returned by the AI service.
 * Validated with Zod before sending to the client.
 */
export const resumeTailoringResultSchema = z.object({
  tailoredSummary: z.string(),
  rewrittenBullets: z.array(rewrittenBulletSchema),
  missingKeywords: z.array(z.string()),
  atsImprovements: z.array(z.string()),
  strengthsToHighlight: z.array(z.string()),
});

export type RewrittenBullet = z.infer<typeof rewrittenBulletSchema>;
export type ResumeTailoringResult = z.infer<typeof resumeTailoringResultSchema>;
