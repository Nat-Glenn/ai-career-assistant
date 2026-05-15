import Link from "next/link";
import { AtsOptimizeForm } from "@/components/resume/ats-optimize-form";

export default function AtsOptimizePage() {
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
            ATS optimization
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            ATS optimization
          </h1>
          <p className="mt-3 text-muted">
            Compare your resume to a job description. See your match score,
            keyword gaps, and prioritized fixes to improve ATS compatibility.
          </p>
        </div>

        <AtsOptimizeForm />
      </main>
    </div>
  );
}
