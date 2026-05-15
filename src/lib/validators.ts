import { z } from "zod";
import { applicationStatusSchema } from "@/types/application";
import { coverLetterToneSchema } from "@/types/cover-letter";

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

/**
 * Validates POST /api/cover-letter/generate request body.
 */
export const generateCoverLetterSchema = z.object({
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
  companyName: z.string().trim().min(1).max(200).optional(),
  roleTitle: z.string().trim().min(1).max(200).optional(),
  tone: coverLetterToneSchema.optional(),
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

const optionalUrl = z
  .string()
  .trim()
  .url("Job URL must be a valid URL.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalFollowUpDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD.")
  .optional()
  .or(z.literal("").transform(() => undefined));

/**
 * Validates POST /api/applications request body.
 */
export const createApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(200),
  roleTitle: z.string().trim().min(1, "Role title is required.").max(200),
  jobUrl: optionalUrl,
  status: applicationStatusSchema.optional(),
  notes: z.string().trim().max(5000).optional(),
  followUpDate: optionalFollowUpDate,
});

export type CreateApplicationBody = z.infer<typeof createApplicationSchema>;

/**
 * Validates PATCH /api/applications/[id] request body.
 */
export const updateApplicationSchema = z
  .object({
    companyName: z.string().trim().min(1).max(200).optional(),
    roleTitle: z.string().trim().min(1).max(200).optional(),
    jobUrl: z
      .union([
        z.string().trim().url("Job URL must be a valid URL."),
        z.literal(""),
        z.null(),
      ])
      .optional(),
    status: applicationStatusSchema.optional(),
    notes: z
      .union([z.string().trim().max(5000), z.literal(""), z.null()])
      .optional(),
    followUpDate: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD."),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided to update.",
  });

export type UpdateApplicationBody = z.infer<typeof updateApplicationSchema>;
