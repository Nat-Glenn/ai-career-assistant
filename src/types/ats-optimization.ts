import { z } from "zod";

/**
 * Structured ATS optimization result returned by the AI service.
 * Validated with Zod before sending to the client.
 */
export const atsOptimizationResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  keywordSuggestions: z.array(z.string()),
  formattingSuggestions: z.array(z.string()),
  priorityFixes: z.array(z.string()),
});

export type AtsOptimizationResult = z.infer<typeof atsOptimizationResultSchema>;
