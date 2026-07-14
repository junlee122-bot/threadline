export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-medium tracking-[-0.035em] sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-xs leading-5 text-muted sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
