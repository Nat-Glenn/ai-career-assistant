"use client";

import { useCallback, useState } from "react";
import type { ApplicationPackage } from "@/types/application-package";

type JobPackageResultsProps = {
  package: ApplicationPackage;
};

type CopyButtonProps = {
  text: string;
  label: string;
};

const copyButtonClassName =
  "shrink-0 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50";

function formatRewrittenBullets(
  bullets: ApplicationPackage["resumeTailoring"]["rewrittenBullets"],
): string {
  return bullets
    .map((bullet, index) => {
      return `${index + 1}. ${bullet.rewritten}\n   (was: ${bullet.original})`;
    })
    .join("\n\n");
}

function formatBulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

function formatCoverLetter(
  coverLetter: ApplicationPackage["coverLetter"],
): string {
  return `Subject: ${coverLetter.subjectLine}\n\n${coverLetter.fullCoverLetter}`;
}

function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!text.trim()}
      className={copyButtonClassName}
    >
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function Section({
  title,
  copyText,
  copyLabel,
  children,
}: {
  title: string;
  copyText?: string;
  copyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
          {title}
        </h3>
        {copyText && copyLabel && (
          <CopyButton text={copyText} label={copyLabel} />
        )}
      </div>
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
  const tailoredSummary = pkg.resumeTailoring.tailoredSummary;
  const rewrittenBulletsText = formatRewrittenBullets(
    pkg.resumeTailoring.rewrittenBullets,
  );
  const priorityFixesText = formatBulletList(pkg.atsOptimization.priorityFixes);
  const coverLetterText = formatCoverLetter(pkg.coverLetter);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Review each section below. Use copy to paste into your resume editor or
        email — you can edit the text after copying.
      </p>

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

      <Section
        title="ATS optimization"
        copyText={priorityFixesText}
        copyLabel="priority fixes"
      >
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

      <Section
        title="Resume tailoring"
        copyText={tailoredSummary}
        copyLabel="tailored summary"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="flex-1 text-sm leading-relaxed">
            {tailoredSummary}
          </p>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase text-muted">
            Rewritten bullets
          </p>
          <CopyButton text={rewrittenBulletsText} label="rewritten bullets" />
        </div>
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

      <Section
        title="Cover letter"
        copyText={coverLetterText}
        copyLabel="cover letter"
      >
        <p className="mb-2 text-sm font-medium">{pkg.coverLetter.subjectLine}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {pkg.coverLetter.fullCoverLetter}
        </p>
      </Section>
    </div>
  );
}
