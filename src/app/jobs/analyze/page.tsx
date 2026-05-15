import Link from "next/link";
import { JobAnalysisForm } from "@/components/jobs/job-analysis-form";

export default function AnalyzeJobPage() {
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
            Job analysis
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Job description analysis
          </h1>
          <p className="mt-3 text-muted">
            Paste a job posting below. AI will extract skills, responsibilities,
            experience level, and ATS keywords so you can review before tailoring
            your resume.
          </p>
        </div>

        <JobAnalysisForm />
      </main>
    </div>
  );
}
