import type { CoverLetterResult } from "./cover-letter";
import type { JobAnalysisResult } from "./job-analysis";
import type { DiscoveredJob } from "./job";
import type { AtsOptimizationResult } from "./ats-optimization";
import type { ResumeTailoringResult } from "./resume-tailoring";

/**
 * Full application package generated for one job + resume.
 */
export type ApplicationPackage = {
  job: DiscoveredJob;
  analysis: JobAnalysisResult;
  atsOptimization: AtsOptimizationResult;
  resumeTailoring: ResumeTailoringResult;
  coverLetter: CoverLetterResult;
};
