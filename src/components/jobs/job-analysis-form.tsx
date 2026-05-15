"use client";

import { useState } from "react";
import type { JobAnalysisResult } from "@/types/job-analysis";
import { JobAnalysisResults } from "./job-analysis-results";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiSuccessBody = {
  data: JobAnalysisResult;
};

export function JobAnalysisForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobAnalysisResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const json = (await response.json()) as ApiSuccessBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Analysis failed. Please try again.");
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={12}
            required
            minLength={50}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here (at least 50 characters)..."
            className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-muted">
            {jobDescription.trim().length} characters (minimum 50)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || jobDescription.trim().length < 50}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing…" : "Analyze job description"}
        </button>
      </form>

      {isLoading && (
        <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
          Analyzing with AI — this may take a few seconds…
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

      {result && <JobAnalysisResults result={result} />}
    </div>
  );
}
