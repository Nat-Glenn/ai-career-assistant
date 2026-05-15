"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoveredJob } from "@/types/job";
import { JobCard } from "./job-card";
import { JobDiscoveryForm } from "./job-discovery-form";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiJobsBody = {
  data: DiscoveredJob[];
  meta?: {
    count?: number;
    source?: string;
  };
};

function parseKeywords(input: string): string[] | undefined {
  const list = input
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return list.length > 0 ? list : undefined;
}

export function JobDiscoveryTracker() {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDiscoverCount, setLastDiscoverCount] = useState<number | null>(
    null,
  );

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jobs");
      const json = (await response.json()) as ApiJobsBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to load jobs.");
        return;
      }

      setJobs(json.data);
    } catch {
      setError(
        "Could not reach the server. Check that npm run dev is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function handleDiscover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDiscovering(true);
    setError(null);
    setLastDiscoverCount(null);

    const payload: Record<string, unknown> = {
      query: query.trim(),
      remoteOnly,
    };

    if (location.trim()) {
      payload.location = location.trim();
    }

    const keywordList = parseKeywords(keywords);

    if (keywordList) {
      payload.keywords = keywordList;
    }

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiJobsBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Job discovery failed. Please try again.");
        return;
      }

      setLastDiscoverCount(json.meta?.count ?? json.data.length);
      await loadJobs();
    } catch {
      setError("Could not discover jobs. Check your connection and try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  return (
    <div className="space-y-8">
      <JobDiscoveryForm
        query={query}
        location={location}
        remoteOnly={remoteOnly}
        keywords={keywords}
        isSubmitting={isDiscovering}
        onQueryChange={setQuery}
        onLocationChange={setLocation}
        onRemoteOnlyChange={setRemoteOnly}
        onKeywordsChange={setKeywords}
        onSubmit={handleDiscover}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {lastDiscoverCount !== null && !error && (
        <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
          Found {lastDiscoverCount} matching job
          {lastDiscoverCount === 1 ? "" : "s"} from this search (saved to your
          list below).
        </p>
      )}

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Discovered jobs
        </h2>

        {isLoading && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            Loading saved jobs…
          </p>
        )}

        {!isLoading && jobs.length === 0 && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            No jobs saved yet. Run a search above to discover remote listings.
          </p>
        )}

        {!isLoading && jobs.length > 0 && (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
