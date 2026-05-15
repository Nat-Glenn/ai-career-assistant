"use client";

type JobDiscoveryFormProps = {
  query: string;
  location: string;
  remoteOnly: boolean;
  keywords: string;
  isSubmitting: boolean;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onRemoteOnlyChange: (value: boolean) => void;
  onKeywordsChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const inputClassName =
  "w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function JobDiscoveryForm({
  query,
  location,
  remoteOnly,
  keywords,
  isSubmitting,
  onQueryChange,
  onLocationChange,
  onRemoteOnlyChange,
  onKeywordsChange,
  onSubmit,
}: JobDiscoveryFormProps) {
  const canSubmit = query.trim().length > 0;

  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
        Or search manually
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="query"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Search query
          </label>
          <input
            id="query"
            name="query"
            type="text"
            required
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g. typescript react engineer"
            className={inputClassName}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Location <span className="text-muted">(optional)</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="e.g. USA, Europe"
              className={inputClassName}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="keywords"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Keywords <span className="text-muted">(optional, comma-separated)</span>
            </label>
            <input
              id="keywords"
              name="keywords"
              type="text"
              value={keywords}
              onChange={(e) => onKeywordsChange(e.target.value)}
              placeholder="node, aws, devops"
              className={inputClassName}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => onRemoteOnlyChange(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-card-border bg-background accent-accent"
          />
          Remote only
        </label>
        <p className="text-xs text-muted">
          Tip: leave unchecked for onsite-heavy roles (nursing, retail). RemoteOK
          listings skew tech-remote; Adzuna keys in{" "}
          <code className="rounded bg-background px-1 py-0.5 text-[11px]">
            .env.local
          </code>{" "}
          widen industries.
        </p>

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Discovering…" : "Discover jobs"}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">
        Jobs are aggregated from public APIs (RemoteOK, and Adzuna when
        configured). Results are filtered and ranked on your server — no
        LinkedIn or Indeed scraping.
      </p>
    </section>
  );
}
