import type { ApplicationPackage } from "@/types/application-package";

type JobPackageResultsProps = {
  package: ApplicationPackage;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">None listed.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-card-border bg-background px-3 py-1 text-sm"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function JobPackageResults({ package: pkg }: JobPackageResultsProps) {
  return (
    <div className="space-y-4">
      <Section title="Job analysis">
        <p className="mb-3 text-sm leading-relaxed">{pkg.analysis.summary}</p>
        <p className="mb-2 text-xs font-medium uppercase text-muted">
          Technical skills
        </p>
        <TagList items={pkg.analysis.technicalSkills} />
        <p className="mb-2 mt-3 text-xs font-medium uppercase text-muted">
          ATS keywords
        </p>
        <TagList items={pkg.analysis.atsKeywords} />
      </Section>

      <Section title="ATS optimization">
        <p className="mb-2 text-2xl font-semibold text-accent">
          Match score: {pkg.atsOptimization.matchScore}
        </p>
        <p className="mb-2 text-xs font-medium uppercase text-muted">
          Missing keywords
        </p>
        <TagList items={pkg.atsOptimization.missingKeywords} />
        <p className="mb-2 mt-3 text-xs font-medium uppercase text-muted">
          Priority fixes
        </p>
        <BulletList items={pkg.atsOptimization.priorityFixes} />
      </Section>

      <Section title="Resume tailoring">
        <p className="mb-3 text-sm leading-relaxed">
          {pkg.resumeTailoring.tailoredSummary}
        </p>
        <p className="mb-2 text-xs font-medium uppercase text-muted">
          Rewritten bullets
        </p>
        <ul className="space-y-3">
          {pkg.resumeTailoring.rewrittenBullets.map((bullet, index) => (
            <li
              key={`${bullet.original}-${index}`}
              className="rounded-lg border border-card-border bg-background p-3 text-sm"
            >
              <p className="text-muted line-through">{bullet.original}</p>
              <p className="mt-1 text-foreground">{bullet.rewritten}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cover letter">
        <p className="mb-2 text-sm font-medium">{pkg.coverLetter.subjectLine}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {pkg.coverLetter.fullCoverLetter}
        </p>
      </Section>
    </div>
  );
}
