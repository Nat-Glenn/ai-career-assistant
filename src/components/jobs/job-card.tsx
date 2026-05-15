import Link from "next/link";
import type { DiscoveredJob } from "@/types/job";

const PENDING_DESCRIPTION_KEY = "pending-job-description";

type JobCardProps = {
  job: DiscoveredJob;
};

function handleAnalyzeClick(description: string) {
  sessionStorage.setItem(PENDING_DESCRIPTION_KEY, description);
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
          <p className="text-sm text-muted">{job.company}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.remote && (
            <span className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-foreground">
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
      </div>

      {job.location && (
        <p className="mb-2 text-sm text-muted">Location: {job.location}</p>
      )}

      {job.tags && job.tags.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {job.tags.slice(0, 8).map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent hover:underline"
        >
          View posting →
        </a>
        {job.description && (
          <Link
            href="/jobs/analyze"
            onClick={() => handleAnalyzeClick(job.description!)}
            className="text-sm font-medium text-foreground hover:text-accent"
          >
            Analyze description →
          </Link>
        )}
      </div>
    </article>
  );
}

export { PENDING_DESCRIPTION_KEY };
