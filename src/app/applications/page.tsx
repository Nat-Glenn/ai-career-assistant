import Link from "next/link";
import { ApplicationsTracker } from "@/components/applications/applications-tracker";

export default function ApplicationsPage() {
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
          <span className="text-sm font-medium text-foreground">
            Applications
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Application tracking
          </h1>
          <p className="mt-3 text-muted">
            Track where you have applied, follow-up dates, and status updates —
            all in one place.
          </p>
        </div>

        <ApplicationsTracker />
      </main>
    </div>
  );
}
