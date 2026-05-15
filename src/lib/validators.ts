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

/**
 * Validates POST /api/resume/tailor request body.
 */
export const tailorResumeSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(100, "Resume must be at least 100 characters.")
    .max(20000, "Resume must be at most 20,000 characters."),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Job description must be at least 50 characters.")
    .max(15000, "Job description must be at most 15,000 characters."),
});

export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;

/**
 * Validates POST /api/resume/ats-optimize request body.
 * Same fields as tailoring — resume + job description.
 */
export const atsOptimizeSchema = tailorResumeSchema;

export type AtsOptimizeInput = z.infer<typeof atsOptimizeSchema>;
