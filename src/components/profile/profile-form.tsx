"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ExperienceLevel,
  RemotePreference,
  UserProfile,
} from "@/types/profile";

type ApiErrorBody = {
  error?: { code?: string; message?: string };
};

type ApiProfileBody = { data: UserProfile };

const inputClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const textareaClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function listToString(items: string[]): string {
  return items.join(", ");
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileForm() {
  const [fullName, setFullName] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [targetLocations, setTargetLocations] = useState("");
  const [remotePreference, setRemotePreference] =
    useState<RemotePreference>("any");
  const [coreSkills, setCoreSkills] = useState("");
  const [preferredKeywords, setPreferredKeywords] = useState("");
  const [excludedKeywords, setExcludedKeywords] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("entry");
  const [resumeText, setResumeText] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyProfile = useCallback((profile: UserProfile) => {
    setFullName(profile.fullName ?? "");
    setTargetRoles(listToString(profile.targetRoles));
    setTargetLocations(listToString(profile.targetLocations));
    setRemotePreference(profile.remotePreference);
    setCoreSkills(listToString(profile.coreSkills));
    setPreferredKeywords(listToString(profile.preferredKeywords));
    setExcludedKeywords(listToString(profile.excludedKeywords ?? []));
    setExperienceLevel(profile.experienceLevel);
    setResumeText(profile.resumeText ?? "");
    setUpdatedAt(profile.updatedAt);
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile");
      const json = (await response.json()) as ApiProfileBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to load profile.");
        return;
      }

      applyProfile(json.data);
    } catch {
      setError(
        "Could not reach the server. Check that npm run dev is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      fullName: fullName.trim() || undefined,
      targetRoles: parseList(targetRoles),
      targetLocations: parseList(targetLocations),
      remotePreference,
      coreSkills: parseList(coreSkills),
      preferredKeywords: parseList(preferredKeywords),
      excludedKeywords: parseList(excludedKeywords),
      experienceLevel,
      resumeText: resumeText.trim() || undefined,
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiProfileBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to save profile.");
        return;
      }

      applyProfile(json.data);
      setSuccessMessage("Profile saved.");
    } catch {
      setError("Could not save profile. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
        Loading profile…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Basic info
        </h2>
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
            Full name <span className="text-muted">(optional)</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
        <div>
          <label htmlFor="experienceLevel" className="mb-2 block text-sm font-medium">
            Experience level
          </label>
          <select
            id="experienceLevel"
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as ExperienceLevel)
            }
            className={inputClassName}
            disabled={isSaving}
          >
            <option value="internship">Internship</option>
            <option value="entry">Entry</option>
            <option value="junior">Junior</option>
            <option value="intermediate">Intermediate</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Job search preferences
        </h2>
        <div>
          <label htmlFor="targetRoles" className="mb-2 block text-sm font-medium">
            Target roles <span className="text-muted">(comma-separated)</span>
          </label>
          <input
            id="targetRoles"
            type="text"
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            placeholder="Software Engineer, Full Stack Developer"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
        <div>
          <label
            htmlFor="targetLocations"
            className="mb-2 block text-sm font-medium"
          >
            Target locations <span className="text-muted">(comma-separated)</span>
          </label>
          <input
            id="targetLocations"
            type="text"
            value={targetLocations}
            onChange={(e) => setTargetLocations(e.target.value)}
            placeholder="USA, Canada, Remote"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
        <div>
          <label
            htmlFor="remotePreference"
            className="mb-2 block text-sm font-medium"
          >
            Remote preference
          </label>
          <select
            id="remotePreference"
            value={remotePreference}
            onChange={(e) =>
              setRemotePreference(e.target.value as RemotePreference)
            }
            className={inputClassName}
            disabled={isSaving}
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
            <option value="any">Any</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Skills & keywords
        </h2>
        <div>
          <label htmlFor="coreSkills" className="mb-2 block text-sm font-medium">
            Core skills <span className="text-muted">(comma-separated)</span>
          </label>
          <input
            id="coreSkills"
            type="text"
            value={coreSkills}
            onChange={(e) => setCoreSkills(e.target.value)}
            placeholder="TypeScript, React, Node.js"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
        <div>
          <label
            htmlFor="preferredKeywords"
            className="mb-2 block text-sm font-medium"
          >
            Preferred keywords <span className="text-muted">(comma-separated)</span>
          </label>
          <input
            id="preferredKeywords"
            type="text"
            value={preferredKeywords}
            onChange={(e) => setPreferredKeywords(e.target.value)}
            placeholder="API, PostgreSQL, AWS"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
        <div>
          <label
            htmlFor="excludedKeywords"
            className="mb-2 block text-sm font-medium"
          >
            Excluded keywords{" "}
            <span className="text-muted">(optional, comma-separated)</span>
          </label>
          <input
            id="excludedKeywords"
            type="text"
            value={excludedKeywords}
            onChange={(e) => setExcludedKeywords(e.target.value)}
            placeholder="sales, commission-only"
            className={inputClassName}
            disabled={isSaving}
          />
        </div>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Saved resume
        </h2>
        <div>
          <label htmlFor="resumeText" className="mb-2 block text-sm font-medium">
            Resume text <span className="text-muted">(optional)</span>
          </label>
          <textarea
            id="resumeText"
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste a master resume to reuse across features…"
            className={textareaClassName}
            disabled={isSaving}
          />
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {successMessage && (
        <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-accent">
          {successMessage}
        </p>
      )}

      {updatedAt && (
        <p className="text-xs text-muted">
          Last saved: {new Date(updatedAt).toLocaleString()}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
