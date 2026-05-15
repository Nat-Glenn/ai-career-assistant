"use client";

import { useState } from "react";
import type { ApplicationStatus } from "@/types/application";
import type { CreateApplicationBody } from "@/lib/validators";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const inputClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const textareaClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type ApplicationCreateFormProps = {
  isSubmitting: boolean;
  onCreate: (input: CreateApplicationBody) => Promise<void>;
};

export function ApplicationCreateForm({
  isSubmitting,
  onCreate,
}: ApplicationCreateFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateApplicationBody = {
      companyName: companyName.trim(),
      roleTitle: roleTitle.trim(),
      status,
    };

    if (jobUrl.trim()) {
      payload.jobUrl = jobUrl.trim();
    }

    if (notes.trim()) {
      payload.notes = notes.trim();
    }

    if (followUpDate) {
      payload.followUpDate = followUpDate;
    }

    await onCreate(payload);

    setCompanyName("");
    setRoleTitle("");
    setJobUrl("");
    setStatus("saved");
    setNotes("");
    setFollowUpDate("");
  }

  const canSubmit =
    companyName.trim().length > 0 && roleTitle.trim().length > 0;

  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
        Add application
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="companyName"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Company name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. TechCorp"
              className={inputClassName}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="roleTitle"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Role title
            </label>
            <input
              id="roleTitle"
              name="roleTitle"
              type="text"
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClassName}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="jobUrl"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Job URL <span className="text-muted">(optional)</span>
            </label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className={inputClassName}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className={inputClassName}
              disabled={isSubmitting}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="followUpDate"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Follow-up date <span className="text-muted">(optional)</span>
          </label>
          <input
            id="followUpDate"
            name="followUpDate"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className={inputClassName}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Notes <span className="text-muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Recruiter name, referral source, reminders..."
            className={textareaClassName}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Add application"}
        </button>
      </form>
    </section>
  );
}
