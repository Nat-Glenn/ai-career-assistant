import type { ReactNode } from "react";
import type { ResumeTailoringResult } from "@/types/resume-tailoring";

type ResumeTailorResultsProps = {
  result: ResumeTailoringResult;
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

export function ResumeTailorResults({ result }: ResumeTailorResultsProps) {
  return (
    <div className="space-y-4">
      <ResultSection title="Tailored summary">
        <p className="text-sm leading-relaxed text-foreground">
          {result.tailoredSummary}
        </p>
      </ResultSection>

      <ResultSection title="Rewritten bullets">
        {result.rewrittenBullets.length === 0 ? (
          <p className="text-sm text-muted">No bullets suggested.</p>
        ) : (
          <ul className="space-y-4">
            {result.rewrittenBullets.map((bullet, index) => (
              <li
                key={`${bullet.original}-${index}`}
                className="rounded-lg border border-card-border bg-background p-4"
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                  Original
                </p>
                <p className="mb-3 text-sm text-muted line-through">
                  {bullet.original}
                </p>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                  Suggested
                </p>
                <p className="text-sm text-foreground">{bullet.rewritten}</p>
              </li>
            ))}
          </ul>
        )}
      </ResultSection>

      <ResultSection title="Missing keywords">
        <TagList items={result.missingKeywords} />
      </ResultSection>

      <ResultSection title="ATS improvements">
        <BulletList items={result.atsImprovements} />
      </ResultSection>

      <ResultSection title="Strengths to highlight">
        <BulletList items={result.strengthsToHighlight} />
      </ResultSection>
    </div>
  );
}
