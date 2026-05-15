import { z } from "zod";

export const remotePreferenceSchema = z.enum([
  "remote",
  "hybrid",
  "onsite",
  "any",
]);

export const experienceLevelSchema = z.enum([
  "internship",
  "entry",
  "junior",
  "intermediate",
  "senior",
]);

export type RemotePreference = z.infer<typeof remotePreferenceSchema>;
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;

/**
 * User career preferences stored in data/profile.json (MVP, single-user).
 */
export const userProfileSchema = z.object({
  fullName: z.string().optional(),
  targetRoles: z.array(z.string()),
  targetLocations: z.array(z.string()),
  remotePreference: remotePreferenceSchema,
  coreSkills: z.array(z.string()),
  preferredKeywords: z.array(z.string()),
  excludedKeywords: z.array(z.string()).optional(),
  experienceLevel: experienceLevelSchema,
  resumeText: z.string().optional(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
