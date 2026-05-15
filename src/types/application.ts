import { z } from "zod";
import { rewrittenBulletSchema } from "./resume-tailoring";

/** Application pipeline status values. */
export const applicationStatusSchema = z.enum([
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
]);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

/**
 * Application record stored in data/applications.json (MVP).
 */
export const applicationSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  roleTitle: z.string(),
  jobUrl: z.string().optional(),
  status: applicationStatusSchema,
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  tailoredSummary: z.string().optional(),
  rewrittenBullets: z.array(rewrittenBulletSchema).optional(),
  atsPriorityFixes: z.array(z.string()).optional(),
  generatedCoverLetter: z.string().optional(),
  analyzedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Application = z.infer<typeof applicationSchema>;

export const applicationListSchema = z.array(applicationSchema);

/** True when an application has any saved AI package outputs. */
export function applicationHasAiMaterials(application: Application): boolean {
  return Boolean(
    application.matchScore !== undefined ||
      application.tailoredSummary ||
      (application.rewrittenBullets?.length ?? 0) > 0 ||
      (application.atsPriorityFixes?.length ?? 0) > 0 ||
      application.generatedCoverLetter,
  );
}
