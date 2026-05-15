import type { ReactNode } from "react";
import type { CoverLetterResult } from "@/types/cover-letter";

type CoverLetterGenerateResultsProps = {
  result: CoverLetterResult;
};

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

function Paragraph({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-foreground">{text}</p>;
}

export function CoverLetterGenerateResults({
  result,
}: CoverLetterGenerateResultsProps) {
  return (
    <div className="space-y-4">
      <ResultSection title="Subject line">
        <Paragraph text={result.subjectLine} />
      </ResultSection>

      <ResultSection title="Opening">
        <Paragraph text={result.openingParagraph} />
      </ResultSection>

      <ResultSection title="Body">
        <div className="space-y-4">
          {result.bodyParagraphs.map((paragraph, index) => (
            <Paragraph key={`body-${index}`} text={paragraph} />
          ))}
        </div>
      </ResultSection>

      <ResultSection title="Closing">
        <Paragraph text={result.closingParagraph} />
      </ResultSection>

      <ResultSection title="Full cover letter">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {result.fullCoverLetter}
        </p>
      </ResultSection>
    </div>
  );
}
