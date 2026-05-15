import type { ReactNode } from "react";
import type { JobAnalysisResult } from "@/types/job-analysis";

type JobAnalysisResultsProps = {
  result: JobAnalysisResult;
};

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">None identified.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-card-border bg-background px-3 py-1 text-sm text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">None identified.</p>;
  }

  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function JobAnalysisResults({ result }: JobAnalysisResultsProps) {
  return (
    <div className="space-y-4">
      <ResultSection title="Summary">
        <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
      </ResultSection>

      <ResultSection title="Technical skills">
        <TagList items={result.technicalSkills} />
      </ResultSection>

      <ResultSection title="Soft skills">
        <TagList items={result.softSkills} />
      </ResultSection>

      <ResultSection title="Responsibilities">
        <BulletList items={result.responsibilities} />
      </ResultSection>

      <ResultSection title="Experience required">
        <p className="text-sm text-foreground">
          {result.experienceYears ?? "Not specified"}
        </p>
      </ResultSection>

      <ResultSection title="ATS keywords">
        <TagList items={result.atsKeywords} />
      </ResultSection>
    </div>
  );
}
