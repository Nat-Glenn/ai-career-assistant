"use client";

import { useState } from "react";
import type { CoverLetterResult, CoverLetterTone } from "@/types/cover-letter";
import { CoverLetterGenerateResults } from "./cover-letter-generate-results";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiSuccessBody = {
  data: CoverLetterResult;
};

const MIN_RESUME_LENGTH = 100;
const MIN_JOB_LENGTH = 50;

const TONE_OPTIONS: { value: CoverLetterTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "formal", label: "Formal" },
];

const textareaClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const inputClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function CoverLetterGenerateForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResult | null>(null);

  const resumeLength = resumeText.trim().length;
  const jobLength = jobDescription.trim().length;
  const canSubmit =
    resumeLength >= MIN_RESUME_LENGTH && jobLength >= MIN_JOB_LENGTH;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const payload: Record<string, string> = {
      resumeText,
      jobDescription,
      tone,
    };

    if (companyName.trim()) {
      payload.companyName = companyName.trim();
    }

    if (roleTitle.trim()) {
      payload.roleTitle = roleTitle.trim();
    }

    try {
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiSuccessBody & ApiErrorBody;

      if (!response.ok) {
        setError(
          json.error?.message ??
            "Cover letter generation failed. Please try again.",
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="companyName"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Company name <span className="text-muted">(optional)</span>
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputClassName}
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="roleTitle"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Role title <span className="text-muted">(optional)</span>
            </label>
            <input
              id="roleTitle"
              name="roleTitle"
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClassName}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="tone"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Tone
          </label>
          <select
            id="tone"
            name="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as CoverLetterTone)}
            className={inputClassName}
            disabled={isLoading}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
          {isLoading ? "Generating…" : "Generate cover letter"}
        </button>
      </form>

      {isLoading && (
        <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
          Generating your cover letter with AI — this may take a few seconds…
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

      {result && <CoverLetterGenerateResults result={result} />}
    </div>
  );
}
