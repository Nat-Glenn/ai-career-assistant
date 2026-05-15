import { analyzeJobDescription } from "@/services/job-analysis";
import { generateCoverLetter } from "@/services/cover-letter/generate";
import { optimizeResumeForAts } from "@/services/resume/ats-optimize";
import { tailorResume } from "@/services/resume/tailor";
import type { DiscoveredJob } from "@/types/job";
import type { ApplicationPackage } from "@/types/application-package";

/**
 * Builds a job description string for AI services.
 * Uses the stored description when available; otherwise falls back to metadata.
 */
export function buildJobDescriptionText(job: DiscoveredJob): string {
  if (job.description && job.description.trim().length >= 50) {
    return job.description.trim();
  }

  const lines = [
    `Role: ${job.title}`,
    `Company: ${job.company}`,
    job.location ? `Location: ${job.location}` : null,
    job.remote ? "Work arrangement: Remote" : null,
    job.tags?.length ? `Tags: ${job.tags.join(", ")}` : null,
    job.url ? `Posting URL: ${job.url}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Generates a complete application package with minimal duplicate AI work:
 * 1. Job analysis runs once on the job description.
 * 2. ATS, tailoring, and cover letter run in parallel (same inputs, no re-analysis).
 */
export async function generateApplicationPackage(
  job: DiscoveredJob,
  resumeText: string,
): Promise<ApplicationPackage> {
  const jobDescription = buildJobDescriptionText(job);

  const analysis = await analyzeJobDescription(jobDescription);

  const [atsOptimization, resumeTailoring, coverLetter] = await Promise.all([
    optimizeResumeForAts(resumeText, jobDescription),
    tailorResume(resumeText, jobDescription),
    generateCoverLetter({
      resumeText,
      jobDescription,
      companyName: job.company,
      roleTitle: job.title,
      tone: "professional",
    }),
  ]);

  return {
    job,
    analysis,
    atsOptimization,
    resumeTailoring,
    coverLetter,
  };
}
