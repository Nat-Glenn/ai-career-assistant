import { z } from "zod";

/**
 * Structured job analysis result returned by the AI service.
 * Zod schema validates OpenAI JSON before it reaches the client.
 */
export const jobAnalysisResultSchema = z.object({
  summary: z.string(),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  experienceYears: z.string().nullable(),
  atsKeywords: z.array(z.string()),
});

export type JobAnalysisResult = z.infer<typeof jobAnalysisResultSchema>;
