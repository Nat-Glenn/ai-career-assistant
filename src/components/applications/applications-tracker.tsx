"use client";

import { useCallback, useEffect, useState } from "react";
import type { Application, ApplicationStatus } from "@/types/application";
import type { CreateApplicationBody } from "@/lib/validators";
import { ApplicationCard } from "./application-card";
import { ApplicationCreateForm } from "./application-create-form";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiListBody = {
  data: Application[];
};

type ApiSingleBody = {
  data: Application;
};

export function ApplicationsTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/applications");
      const json = (await response.json()) as ApiListBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to load applications.");
        return;
      }

      setApplications(json.data);
    } catch {
      setError(
        "Could not reach the server. Check that npm run dev is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function handleCreate(input: CreateApplicationBody) {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = (await response.json()) as ApiSingleBody & ApiErrorBody;

      if (!response.ok) {
        setError(json.error?.message ?? "Failed to create application.");
        return;
      }

      setApplications((current) => [json.data, ...current]);
    } catch {
      setError("Could not create application. Check your connection.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    setError(null);

    const previous = applications;

    setApplications((current) =>
      current.map((app) => (app.id === id ? { ...app, status } : app)),
    );

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = (await response.json()) as ApiSingleBody & ApiErrorBody;

      if (!response.ok) {
        setApplications(previous);
        setError(json.error?.message ?? "Failed to update status.");
        return;
      }

      setApplications((current) =>
        current.map((app) => (app.id === id ? json.data : app)),
      );
    } catch {
      setApplications(previous);
      setError("Could not update status. Check your connection.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this application? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError(null);

    const previous = applications;

    setApplications((current) => current.filter((app) => app.id !== id));

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });

      const json = (await response.json()) as ApiErrorBody;

      if (!response.ok) {
        setApplications(previous);
        setError(json.error?.message ?? "Failed to delete application.");
      }
    } catch {
      setApplications(previous);
      setError("Could not delete application. Check your connection.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <ApplicationCreateForm
        isSubmitting={isCreating}
        onCreate={handleCreate}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Your applications
        </h2>

        {isLoading && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            Loading applications…
          </p>
        )}

        {!isLoading && applications.length === 0 && (
          <p className="rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            No applications yet. Add your first one above.
          </p>
        )}

        {!isLoading && applications.length > 0 && (
          <ul className="space-y-4">
            {applications.map((application) => (
              <li key={application.id}>
                <ApplicationCard
                  application={application}
                  isUpdating={updatingId === application.id}
                  isDeleting={deletingId === application.id}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
