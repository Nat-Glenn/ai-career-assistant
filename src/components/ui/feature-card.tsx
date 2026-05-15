import Link from "next/link";

type FeatureCardProps = {
  title: string;
  description: string;
  /** When set, the card links to a feature page. */
  href?: string;
  /** Badge text — defaults to "Available" when linked, "Coming soon" otherwise. */
  status?: string;
};

const cardClassName =
  "block rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-zinc-700";

export function FeatureCard({
  title,
  description,
  href,
  status,
}: FeatureCardProps) {
  const badge = status ?? (href ? "Available" : "Coming soon");

  const content = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="shrink-0 rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-muted">
          {badge}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      {href && (
        <p className="mt-4 text-sm font-medium text-accent">Open feature →</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
