import Link from "next/link";
import { JobPackageWorkflow } from "@/components/jobs/job-package-workflow";

type JobPackagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobPackagePage({ params }: JobPackagePageProps) {
  const { id } = await params;

  return (
    <div className="min-h-full">
      <header className="border-b border-card-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/jobs"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Jobs
          </Link>
          <span className="text-sm font-medium text-foreground">
            Application package
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Job match & application package
          </h1>
          <p className="mt-3 text-muted">
            Generate analysis, ATS suggestions, tailored resume bullets, and a
            cover letter for this role. Your saved career profile resume will
            pre-fill when available — edit it before generating.
          </p>
        </div>

        <JobPackageWorkflow jobId={id} />
      </main>
    </div>
  );
}
