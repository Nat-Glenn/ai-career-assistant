import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    title: "Job Discovery",
    description:
      "Aggregate relevant openings from publicly accessible job boards and ATS listings, then filter by your preferences.",
  },
  {
    title: "Resume Tailoring",
    description:
      "Align your resume with a specific role by improving bullet points, emphasis, and keyword relevance.",
  },
  {
    title: "ATS Optimization",
    description:
      "Identify missing keywords and phrasing gaps so your resume performs better in applicant tracking systems.",
  },
  {
    title: "Cover Letter Generation",
    description:
      "Draft personalized cover letters you can review and edit before sending with each application.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-full">
      <header className="border-b border-card-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <p className="text-sm font-medium tracking-wide text-muted">
            AI Career Assistant
          </p>
          <span className="rounded-full border border-card-border px-3 py-1 text-xs text-muted">
            MVP
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="mb-16 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            AI Career Assistant
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            An AI-powered job search platform that helps you discover roles,
            tailor your resume, optimize for ATS, and generate cover letters —
            with you in control at every step.
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted">
            Platform features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-card-border">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-muted">
            Built for intelligent, high-quality job applications — not mass
            automation.
          </p>
        </div>
      </footer>
    </div>
  );
}
