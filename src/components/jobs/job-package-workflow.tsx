"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ApplicationPackage } from "@/types/application-package";
import type { DiscoveredJob } from "@/types/job";
import { JobPackageResults } from "./job-package-results";

type ApiErrorBody = {
  error?: { code?: string; message?: string };
};

type ApiJobBody = { data: DiscoveredJob };
type ApiPackageBody = { data: ApplicationPackage };
type ApiProfileBody = {
  data: { resumeText?: string };
};

const textareaClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const MIN_RESUME_LENGTH = 100;

type JobPackageWorkflowProps = {
  jobId: string;
};

export function JobPackageWorkflow({ jobId }: JobPackageWorkflowProps) {
  const [job, setJob] = useState<DiscoveredJob | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeLoadedFromProfile, setResumeLoadedFromProfile] = useState(false);
  const [applicationPackage, setApplicationPackage] =
    useState<ApplicationPackage | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    setIsLoadingJob(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const json = (await response.json()) as ApiJobBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Job not found.");
        setJob(null);
        return;
      }

      setJob(json.data);
    } catch {
      setError("Could not load job. Check that npm run dev is running.");
    } finally {
      setIsLoadingJob(false);
    }
  }, [jobId]);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);

    try {
      const response = await fetch("/api/profile");
      const json = (await response.json()) as ApiProfileBody & ApiErrorBody;

      if (!response.ok) {
        return;
      }

      const savedResume = json.data.resumeText?.trim();

      if (savedResume) {
        setResumeText(savedResume);
        setResumeLoadedFromProfile(true);
      }
    } catch {
      // Profile prefill is optional; paste workflow still works.
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadJob();
    void loadProfile();
  }, [loadJob, loadProfile]);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSaveMessage(null);
    setApplicationPackage(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const json = (await response.json()) as ApiPackageBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to generate application package.");
        return;
      }

      setApplicationPackage(json.data);
    } catch {
      setError("Package generation failed. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveToTracker() {
    if (!job) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: job.company,
          roleTitle: job.title,
          jobUrl: job.url,
          status: "saved",
          notes: applicationPackage
            ? "Saved from application package workflow."
            : undefined,
        }),
      });

      const json = (await response.json()) as ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to save to application tracker.");
        return;
      }

      setSaveMessage("Saved to application tracker.");
    } catch {
      setError("Could not save application. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingJob) {
    return (
      <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
        Loading job…
      </p>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <Link href="/jobs" className="text-sm text-accent hover:underline">
          ← Back to job discovery
        </Link>
      </div>
    );
  }

  const resumeLength = resumeText.trim().length;
  const canGenerate = resumeLength >= MIN_RESUME_LENGTH;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-xl font-semibold text-foreground">{job.title}</h2>
        <p className="text-muted">{job.company}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.remote && (
            <span className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs">
              Remote
            </span>
          )}
          <span className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-muted">
            {job.source}
          </span>
          {job.relevanceScore !== undefined && (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
              Score {job.relevanceScore}
            </span>
          )}
        </div>
        {job.location && (
          <p className="mt-3 text-sm text-muted">Location: {job.location}</p>
        )}
        {job.tags && job.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
        {job.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {job.description.slice(0, 500)}
            {job.description.length > 500 ? "…" : ""}
          </p>
        )}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          View original posting →
        </a>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Your resume
        </h2>
        {isLoadingProfile && (
          <p className="mb-3 text-xs text-muted">Checking career profile…</p>
        )}
        {!isLoadingProfile && resumeLoadedFromProfile && (
          <p className="mb-3 text-xs text-accent">
            Loaded resume from your career profile
          </p>
        )}
        {!isLoadingProfile && !resumeLoadedFromProfile && (
          <p className="mb-3 text-xs text-muted">
            Paste your resume below, or{" "}
            <Link
              href="/profile"
              className="text-accent underline-offset-2 hover:underline"
            >
              save one on your career profile
            </Link>{" "}
            to auto-fill next time.
          </p>
        )}
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea
            id="resumeText"
            rows={10}
            required
            minLength={MIN_RESUME_LENGTH}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume here (at least 100 characters)…"
            className={textareaClassName}
            disabled={isGenerating}
          />
          <p className="text-xs text-muted">
            {resumeLength} characters (minimum {MIN_RESUME_LENGTH})
          </p>
          <button
            type="submit"
            disabled={isGenerating || !canGenerate}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating
              ? "Generating package…"
              : "Generate application package"}
          </button>
        </form>
        {isGenerating && (
          <p className="mt-4 text-sm text-muted">
            Running job analysis, then ATS optimization, resume tailoring, and
            cover letter in parallel — this may take 30–60 seconds…
          </p>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {applicationPackage && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
              Application package
            </h2>
            <button
              type="button"
              onClick={handleSaveToTracker}
              disabled={isSaving}
              className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-zinc-600 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save to application tracker"}
            </button>
          </div>
          {saveMessage && (
            <p className="text-sm text-accent">{saveMessage}</p>
          )}
          <JobPackageResults package={applicationPackage} />
        </>
      )}

      <Link href="/jobs" className="text-sm text-muted hover:text-foreground">
        ← Back to job discovery
      </Link>
    </div>
  );
}
