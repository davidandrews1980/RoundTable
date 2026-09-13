/** Placeholder inventory. Swap the inner copy for a sold ad or another Pathway app. */
export function AdSlot({
  slot,
  label = "Your ad here",
}: {
  slot: string;
  label?: string;
}) {
  return (
    <aside
      data-ad-slot={slot}
      className="rounded-[var(--radius-md)] border border-dashed border-border bg-elevated px-4 py-5 text-center"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">
        {slot}
      </p>
      <p className="mt-2 text-sm text-fg">{label}</p>
      <p className="mt-1 text-xs text-muted">
        Unsold space runs Pathway apps. Desire Paths · Formation · Almost
        Uncensored TV.
      </p>
    </aside>
  );
}
