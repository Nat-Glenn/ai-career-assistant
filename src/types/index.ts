/**
 * Shared TypeScript types used across the app.
 */

export type { Job } from "./job";
export type { Application } from "./application";
export type { ResumeInput } from "./resume";
export type { ApiError } from "./api";
export type { JobAnalysisResult } from "./job-analysis";
export { jobAnalysisResultSchema } from "./job-analysis";
export type {
  ResumeTailoringResult,
  RewrittenBullet,
} from "./resume-tailoring";
export { resumeTailoringResultSchema } from "./resume-tailoring";
