import Link from "next/link";
import { CoverLetterGenerateForm } from "@/components/cover-letter/cover-letter-generate-form";

export default function CoverLetterGeneratePage() {
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
            Cover letter
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Cover letter generation
          </h1>
          <p className="mt-3 text-muted">
            Paste your resume and a job description. AI will draft a personalized
            cover letter you can review and edit before sending.
          </p>
        </div>

        <CoverLetterGenerateForm />
      </main>
    </div>
  );
}
