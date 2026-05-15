import Link from "next/link";

/**
 * Placeholder for the Job Discovery engine (not built yet).
 * Job Analysis is available at /jobs/analyze.
 */
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
          <span className="text-sm font-medium text-foreground">Job discovery</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-xl border border-card-border bg-card p-8">
          <span className="rounded-full border border-card-border bg-background px-3 py-1 text-xs text-muted">
            Coming soon
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Job discovery
          </h1>
          <p className="mt-3 text-muted">
            Automatic job aggregation from publicly accessible sources is on the
            roadmap. For now, you can analyze a job description you already have.
          </p>
          <Link
            href="/jobs/analyze"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Go to job analysis
          </Link>
        </div>
      </main>
    </div>
  );
}
