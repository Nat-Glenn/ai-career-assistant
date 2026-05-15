import type { ReactNode } from "react";
import type { AtsOptimizationResult } from "@/types/ats-optimization";

type AtsOptimizeResultsProps = {
  result: AtsOptimizationResult;
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

function matchScoreLabel(score: number): string {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Moderate match";
  return "Needs improvement";
}

export function AtsOptimizeResults({ result }: AtsOptimizeResultsProps) {
  return (
    <div className="space-y-4">
      <ResultSection title="Match score">
        <div className="flex items-end gap-4">
          <p className="text-5xl font-semibold tabular-nums text-foreground">
            {result.matchScore}
          </p>
          <div>
            <p className="text-sm font-medium text-foreground">
              {matchScoreLabel(result.matchScore)}
            </p>
            <p className="text-xs text-muted">Out of 100 (keyword alignment)</p>
          </div>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-background"
          role="progressbar"
          aria-valuenow={result.matchScore}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${result.matchScore}%` }}
          />
        </div>
      </ResultSection>

      <ResultSection title="Matched keywords">
        <TagList items={result.matchedKeywords} />
      </ResultSection>

      <ResultSection title="Missing keywords">
        <TagList items={result.missingKeywords} />
      </ResultSection>

      <ResultSection title="Keyword suggestions">
        <BulletList items={result.keywordSuggestions} />
      </ResultSection>

      <ResultSection title="Formatting suggestions">
        <BulletList items={result.formattingSuggestions} />
      </ResultSection>

      <ResultSection title="Priority fixes">
        <BulletList items={result.priorityFixes} />
      </ResultSection>
    </div>
  );
}
