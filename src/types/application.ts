import { z } from "zod";

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
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Application = z.infer<typeof applicationSchema>;

export const applicationListSchema = z.array(applicationSchema);
