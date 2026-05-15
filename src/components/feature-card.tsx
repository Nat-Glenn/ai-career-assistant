type FeatureCardProps = {
  title: string;
  description: string;
  status?: string;
};

export function FeatureCard({
  title,
  description,
  status = "Coming soon",
}: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-zinc-700">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="shrink-0 rounded-full border border-card-border bg-background px-2.5 py-0.5 text-xs text-muted">
          {status}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </article>
  );
}
