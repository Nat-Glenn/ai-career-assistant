"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DiscoveredJob } from "@/types/job";
import type { UserProfile } from "@/types/profile";
import { JobCard } from "./job-card";
import { JobDiscoveryForm } from "./job-discovery-form";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    missing?: string[];
  };
};

type ApiJobsBody = {
  data: DiscoveredJob[];
  meta?: {
    count?: number;
    source?: string;
    queriesRun?: number;
    roles?: string[];
  };
};

type ApiProfileBody = {
  data: UserProfile;
};

function parseKeywords(input: string): string[] | undefined {
  const list = input
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return list.length > 0 ? list : undefined;
}

function listToString(items: string[]): string {
  return items.join(", ");
}

function isProfileReadyForDiscovery(profile: UserProfile): boolean {
  return profile.targetRoles.length > 0;
}

export function JobDiscoveryTracker() {
  const [libraryJobs, setLibraryJobs] = useState<DiscoveredJob[]>([]);
  const [manualResults, setManualResults] = useState<DiscoveredJob[] | null>(
    null,
  );
  const [manualQueryKey, setManualQueryKey] = useState("");
  const [profileResults, setProfileResults] = useState<DiscoveredJob[] | null>(
    null,
  );

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  /** Default off: many fields (e.g. healthcare) are mostly onsite; profile can set true for remote preference. */
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [profileRoles, setProfileRoles] = useState<string[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDiscoveringFromProfile, setIsDiscoveringFromProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDiscoverCount, setLastDiscoverCount] = useState<number | null>(
    null,
  );
  const [lastDiscoverSource, setLastDiscoverSource] = useState<
    "manual" | "profile" | null
  >(null);

  const loadLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    setError(null);

    try {
      const response = await fetch("/api/jobs");
      const json = (await response.json()) as ApiJobsBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to load jobs.");
        return;
      }

      setLibraryJobs(json.data);
    } catch {
      setError(
        "Could not reach the server. Check that npm run dev is running.",
      );
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);

    try {
      const response = await fetch("/api/profile");
      const json = (await response.json()) as ApiProfileBody & ApiErrorBody;

      if (!response.ok) {
        return;
      }

      const profile = json.data;
      const ready = isProfileReadyForDiscovery(profile);

      setProfileReady(ready);
      setProfileRoles(profile.targetRoles);

      if (ready) {
        setQuery(profile.targetRoles[0] ?? "");
        setLocation(listToString(profile.targetLocations));
        setRemoteOnly(profile.remotePreference === "remote");
        // Do not prefill keywords from profile — manual search must stay independent of profile skills.
      }
    } catch {
      // Profile hints are optional; manual search still works.
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!manualQueryKey) {
      return;
    }

    if (query.trim() !== manualQueryKey) {
      setManualResults(null);
      setManualQueryKey("");
    }
  }, [query, manualQueryKey]);

  async function handleDiscoverFromProfile() {
    setIsDiscoveringFromProfile(true);
    setError(null);
    setLastDiscoverCount(null);
    setLastDiscoverSource(null);

    try {
      const response = await fetch("/api/jobs/discover-from-profile", {
        method: "POST",
      });

      const json = (await response.json()) as ApiJobsBody & ApiErrorBody;

      if (!response.ok) {
        if (json.error?.code === "PROFILE_INCOMPLETE") {
          setError(
            json.error.message ??
              "Add target roles in your profile before discovering jobs.",
          );
        } else {
          setError(
            json.error?.message ??
              "Profile-based discovery failed. Please try again.",
          );
        }
        return;
      }

      setProfileResults(json.data);
      setManualResults(null);
      setManualQueryKey("");

      setLastDiscoverCount(json.meta?.count ?? json.data.length);
      setLastDiscoverSource("profile");
      await loadLibrary();
    } catch {
      setError(
        "Could not discover jobs from profile. Check your connection and try again.",
      );
    } finally {
      setIsDiscoveringFromProfile(false);
    }
  }

  async function handleDiscover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDiscovering(true);
    setError(null);
    setLastDiscoverCount(null);
    setLastDiscoverSource(null);

    const trimmedQuery = query.trim();

    const payload: Record<string, unknown> = {
      query: trimmedQuery,
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

      setManualResults(json.data);
      setManualQueryKey(trimmedQuery);
      setProfileResults(null);

      setLastDiscoverCount(json.meta?.count ?? json.data.length);
      setLastDiscoverSource("manual");
      await loadLibrary();
    } catch {
      setError("Could not discover jobs. Check your connection and try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  const isBusy = isDiscovering || isDiscoveringFromProfile;

  const showManualSection =
    manualResults !== null &&
    manualQueryKey.length > 0 &&
    manualQueryKey === query.trim();

  const trimmedQuery = query.trim();

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted">
          Discover from profile
        </h2>
        <p className="mb-4 text-sm text-muted">
          Uses your saved target roles, skills, keywords, locations, and remote
          preference to search automatically.
        </p>

        {isLoadingProfile && (
          <p className="text-sm text-muted">Loading profile preferences…</p>
        )}

        {!isLoadingProfile && !profileReady && (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
            <p>
              Your profile is missing target roles. Add at least one role on the{" "}
              <Link href="/profile" className="text-accent underline-offset-2 hover:underline">
                career preferences
              </Link>{" "}
              page to enable automatic discovery.
            </p>
          </div>
        )}

        {!isLoadingProfile && profileReady && (
          <p className="mb-4 text-xs text-muted">
            Searching for: {profileRoles.join(", ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleDiscoverFromProfile()}
          disabled={isBusy || isLoadingProfile || !profileReady}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDiscoveringFromProfile
            ? "Discovering from profile…"
            : "Discover from profile"}
        </button>
      </section>

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
          {lastDiscoverSource === "profile"
            ? `Found ${lastDiscoverCount} job${lastDiscoverCount === 1 ? "" : "s"} from your profile preferences`
            : `Found ${lastDiscoverCount} matching job${lastDiscoverCount === 1 ? "" : "s"} from this manual search`}
          {" "}
          (merged into all saved jobs below).
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Current manual search results
        </h2>
        <p className="text-xs text-muted">
          Only jobs returned by your latest manual Discover run for the query
          shown in the form. Changing the query clears this list. This is not a
          filter over your entire saved library.
        </p>

        {trimmedQuery.length === 0 && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            Enter a search query, then run Discover jobs.
          </p>
        )}

        {trimmedQuery.length > 0 && !showManualSection && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            Run <span className="text-foreground">Discover jobs</span> to load
            results for &quot;{trimmedQuery}&quot;. Saved jobs from older
            searches are listed separately below and are not mixed in here.
          </p>
        )}

        {showManualSection && manualResults!.length === 0 && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            No jobs passed relevance filters for this search. Try broader
            wording, turn off Remote only, or configure Adzuna for non-tech
            roles (see .env.example).
          </p>
        )}

        {showManualSection && manualResults!.length > 0 && (
          <ul className="space-y-4">
            {manualResults!.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {profileResults !== null && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
            Latest profile discovery
          </h2>
          <p className="text-xs text-muted">
            Jobs returned from the most recent &quot;Discover from profile&quot;
            run (also saved to your library below).
          </p>
          {profileResults.length === 0 ? (
            <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
              No jobs from the last profile run.
            </p>
          ) : (
            <ul className="space-y-4">
              {profileResults.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted">
          All saved jobs
        </h2>
        <p className="mb-4 text-xs text-muted">
          Everything stored in your local job library (newest first). This
          includes past manual and profile runs.
        </p>

        {isLoadingLibrary && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            Loading saved jobs…
          </p>
        )}

        {!isLoadingLibrary && libraryJobs.length === 0 && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            {profileReady
              ? "No jobs saved yet. Use Discover from profile above, or run a manual search."
              : "No jobs saved yet. Set up your career preferences, then use Discover from profile, or search manually."}
          </p>
        )}

        {!isLoadingLibrary && libraryJobs.length > 0 && (
          <ul className="space-y-4">
            {libraryJobs.map((job) => (
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
