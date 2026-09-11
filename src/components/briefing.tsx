import { Button } from "@/components/ui/button";
import { AI_PROVIDERS } from "@/lib/providers";
import { Mark } from "@/lib/logo";

export function RoundtableBriefing({
  onContinue,
  busy,
}: {
  onContinue: () => void;
  busy?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-10">
        <div className="flex items-center gap-3 text-muted">
          <Mark className="size-8" />
          <p className="text-xs font-medium uppercase tracking-[0.18em]">
            Roundtable · first sitting
          </p>
        </div>
        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">
          The table only speaks when you bring the voices.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          Roundtable is bring-your-own-key. For every AI you want seated, you
          need an API key from that provider. We store keys on your account
          only. We never send one provider’s key to another. You do not need
          every key — only the seats you actually fill.
        </p>
        <ol className="mt-8 space-y-3 border-t border-border pt-6 text-sm leading-relaxed text-fg">
          <li>
            <span className="text-muted">1.</span> Create an account at each
            provider you want at the table.
          </li>
          <li>
            <span className="text-muted">2.</span> Generate an API key. Keep it
            private.
          </li>
          <li>
            <span className="text-muted">3.</span> Paste the keys on the Keys
            page. We show only the last four digits after that.
          </li>
          <li>
            <span className="text-muted">4.</span> Seat two to six models, put a
            question in the center, and convene.
          </li>
        </ol>
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {AI_PROVIDERS.map((p) => (
            <li
              key={p.id}
              className="flex items-baseline justify-between gap-4 py-3 text-sm"
            >
              <span className="text-fg">
                {p.name}
                <span className="ml-2 text-muted">{p.vendor}</span>
              </span>
              <a
                href={p.docs}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline decoration-border underline-offset-4 hover:text-fg"
              >
                Get a key
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-subtle">
          Keys never leave your account. Each round spends the quota on the
          keys you seated — not ours. If a seat has no key, that chair stays
          empty.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onContinue} disabled={busy} className="sm:min-w-48">
            {busy ? "Saving…" : "I understand — continue to keys"}
          </Button>
        </div>
      </div>
    </div>
  );
}
