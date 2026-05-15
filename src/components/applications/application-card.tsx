import type { Application, ApplicationStatus } from "@/types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const selectClassName =
  "rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type ApplicationCardProps = {
  application: Application;
  isUpdating: boolean;
  isDeleting: boolean;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
};

export function ApplicationCard({
  application,
  isUpdating,
  isDeleting,
  onStatusChange,
  onDelete,
}: ApplicationCardProps) {
  return (
    <article className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {application.roleTitle}
          </h3>
          <p className="text-sm text-muted">{application.companyName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={application.status}
            onChange={(e) =>
              onStatusChange(
                application.id,
                e.target.value as ApplicationStatus,
              )
            }
            disabled={isUpdating || isDeleting}
            className={selectClassName}
            aria-label={`Status for ${application.companyName}`}
          >
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ),
            )}
          </select>
          <button
            type="button"
            onClick={() => onDelete(application.id)}
            disabled={isUpdating || isDeleting}
            className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-300 transition-colors hover:bg-red-950/30 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {application.jobUrl && (
        <p className="mb-2 text-sm">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            View job posting
          </a>
        </p>
      )}

      {application.followUpDate && (
        <p className="mb-2 text-sm text-muted">
          Follow-up: {application.followUpDate}
        </p>
      )}

      {application.notes && (
        <p className="mb-2 text-sm leading-relaxed text-foreground">
          {application.notes}
        </p>
      )}

      <p className="text-xs text-muted">
        Updated {new Date(application.updatedAt).toLocaleString()}
      </p>
    </article>
  );
}
