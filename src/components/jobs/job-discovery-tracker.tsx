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
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [profileRoles, setProfileRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setKeywords(
          listToString([
            ...profile.coreSkills,
            ...profile.preferredKeywords,
          ]),
        );
      }
    } catch {
      // Profile hints are optional; manual search still works.
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
    void loadProfile();
  }, [loadJobs, loadProfile]);

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

      setLastDiscoverCount(json.meta?.count ?? json.data.length);
      setLastDiscoverSource("profile");
      await loadJobs();
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
      setLastDiscoverSource("manual");
      await loadJobs();
    } catch {
      setError("Could not discover jobs. Check your connection and try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  const isBusy = isDiscovering || isDiscoveringFromProfile;

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
            : `Found ${lastDiscoverCount} matching job${lastDiscoverCount === 1 ? "" : "s"} from this search`}
          {" "}
          (saved to your list below).
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
            {profileReady
              ? "No jobs saved yet. Use Discover from profile above, or run a manual search."
              : "No jobs saved yet. Set up your career preferences, then use Discover from profile."}
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
