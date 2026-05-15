/**
 * Shared TypeScript types used across the app.
 */

export type { DiscoveredJob } from "./job";
export { discoveredJobSchema, discoveredJobListSchema } from "./job";
export type { ApplicationPackage } from "./application-package";
export type { Application, ApplicationStatus } from "./application";
export {
  applicationSchema,
  applicationStatusSchema,
} from "./application";
export type { ResumeInput } from "./resume";
export type { ApiError } from "./api";
export type { JobAnalysisResult } from "./job-analysis";
export { jobAnalysisResultSchema } from "./job-analysis";
export type {
  ResumeTailoringResult,
  RewrittenBullet,
} from "./resume-tailoring";
export { resumeTailoringResultSchema } from "./resume-tailoring";
export type { AtsOptimizationResult } from "./ats-optimization";
export { atsOptimizationResultSchema } from "./ats-optimization";
export type { CoverLetterResult, CoverLetterTone } from "./cover-letter";
export {
  coverLetterResultSchema,
  coverLetterToneSchema,
} from "./cover-letter";
export type {
  UserProfile,
  RemotePreference,
  ExperienceLevel,
} from "./profile";
export {
  userProfileSchema,
  remotePreferenceSchema,
  experienceLevelSchema,
} from "./profile";
