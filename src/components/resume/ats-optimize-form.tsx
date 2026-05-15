"use client";

import { useState } from "react";
import type { AtsOptimizationResult } from "@/types/ats-optimization";
import { AtsOptimizeResults } from "./ats-optimize-results";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiSuccessBody = {
  data: AtsOptimizationResult;
};

const MIN_RESUME_LENGTH = 100;
const MIN_JOB_LENGTH = 50;

const textareaClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function AtsOptimizeForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsOptimizationResult | null>(null);

  const resumeLength = resumeText.trim().length;
  const jobLength = jobDescription.trim().length;
  const canSubmit =
    resumeLength >= MIN_RESUME_LENGTH && jobLength >= MIN_JOB_LENGTH;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/resume/ats-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const json = (await response.json()) as ApiSuccessBody & ApiErrorBody;

      if (!response.ok) {
        setError(
          json.error?.message ?? "ATS optimization failed. Please try again.",
        );
        return;
      }

      setResult(json.data);
    } catch {
      setError(
        "Could not reach the server. Check that npm run dev is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="resumeText"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Resume
          </label>
          <textarea
            id="resumeText"
            name="resumeText"
            rows={10}
            required
            minLength={MIN_RESUME_LENGTH}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here (at least 100 characters)..."
            className={textareaClassName}
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-muted">
            {resumeLength} characters (minimum {MIN_RESUME_LENGTH})
          </p>
        </div>

        <div>
          <label
            htmlFor="jobDescription"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Job description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows={8}
            required
            minLength={MIN_JOB_LENGTH}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here (at least 50 characters)..."
            className={textareaClassName}
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-muted">
            {jobLength} characters (minimum {MIN_JOB_LENGTH})
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing…" : "Optimize for ATS"}
        </button>
      </form>

      {isLoading && (
        <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
          Analyzing ATS fit with AI — this may take a few seconds…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {result && <AtsOptimizeResults result={result} />}
    </div>
  );
}
