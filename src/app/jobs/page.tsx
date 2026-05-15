import Link from "next/link";
import { JobDiscoveryTracker } from "@/components/jobs/job-discovery-tracker";

export default function JobsPage() {
  return (
    <div className="min-h-full">
      <header className="border-b border-card-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/jobs/analyze"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Analyze posting
            </Link>
            <span className="text-sm font-medium text-foreground">
              Job discovery
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Job discovery
          </h1>
          <p className="mt-3 text-muted">
            Search publicly listed remote jobs, review relevance scores, and
            open a posting to analyze or apply.
          </p>
        </div>

        <JobDiscoveryTracker />
      </main>
    </div>
  );
}
