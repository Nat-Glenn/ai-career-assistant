import { z } from "zod";

/**
 * Validates POST /api/jobs/analyze request body.
 * Kept in lib/ so routes stay thin and schemas can be reused by the UI later.
 */
export const analyzeJobDescriptionSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(50, "Job description must be at least 50 characters.")
    .max(15000, "Job description must be at most 15,000 characters."),
});

export type AnalyzeJobDescriptionInput = z.infer<
  typeof analyzeJobDescriptionSchema
>;
