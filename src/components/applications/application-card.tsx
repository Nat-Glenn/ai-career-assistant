import {
  applicationHasAiMaterials,
  type Application,
  type ApplicationStatus,
} from "@/types/application";

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
  const hasAiMaterials = applicationHasAiMaterials(application);

  return (
    <article className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {application.roleTitle}
          </h3>
          <p className="text-sm text-muted">{application.companyName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {application.matchScore !== undefined && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                ATS match {application.matchScore}
              </span>
            )}
            {hasAiMaterials && (
              <span className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-muted">
                AI materials saved
              </span>
            )}
          </div>
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

      {hasAiMaterials && (
        <details className="mt-3 rounded-lg border border-card-border bg-background p-3">
          <summary className="cursor-pointer text-sm font-medium text-accent">
            View saved AI materials
          </summary>
          <div className="mt-3 space-y-4 text-sm text-foreground">
            {application.analyzedAt && (
              <p className="text-xs text-muted">
                Generated{" "}
                {new Date(application.analyzedAt).toLocaleString()}
              </p>
            )}
            {application.tailoredSummary && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted">
                  Tailored summary
                </p>
                <p className="leading-relaxed">{application.tailoredSummary}</p>
              </div>
            )}
            {application.rewrittenBullets &&
              application.rewrittenBullets.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted">
                    Rewritten bullets ({application.rewrittenBullets.length})
                  </p>
                  <ul className="space-y-2">
                    {application.rewrittenBullets.map((bullet, index) => (
                      <li
                        key={`${bullet.original}-${index}`}
                        className="rounded-lg border border-card-border px-3 py-2"
                      >
                        <p className="text-muted line-through text-xs">
                          {bullet.original}
                        </p>
                        <p className="mt-1">{bullet.rewritten}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {application.atsPriorityFixes &&
              application.atsPriorityFixes.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted">
                    ATS priority fixes
                  </p>
                  <ul className="list-inside list-disc space-y-1">
                    {application.atsPriorityFixes.map((fix) => (
                      <li key={fix}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            {application.generatedCoverLetter && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted">
                  Cover letter
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {application.generatedCoverLetter}
                </p>
              </div>
            )}
          </div>
        </details>
      )}

      <p className="mt-3 text-xs text-muted">
        Updated {new Date(application.updatedAt).toLocaleString()}
      </p>
    </article>
  );
}
