import Link from "next/link";
import { ResumeTailorForm } from "@/components/resume/resume-tailor-form";

export default function ResumeTailorPage() {
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
            Resume tailoring
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Resume tailoring
          </h1>
          <p className="mt-3 text-muted">
            Paste your resume and a job description. AI will suggest a tailored
            summary, rewritten bullets, missing keywords, and ATS improvements —
            review everything before you apply.
          </p>
        </div>

        <ResumeTailorForm />
      </main>
    </div>
  );
}
