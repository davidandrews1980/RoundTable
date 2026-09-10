import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthSkeleton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AI_PROVIDERS } from "@/lib/providers";
import { deleteKey, listKeys, saveKey } from "@/lib/server/keys";
import { ExternalLink, Trash2 } from "lucide-react";

export const Route = createFileRoute("/keys")({ component: KeysPage });

function KeysPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <AppShell>
        <AuthSkeleton />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return (
    <AppShell>
      <KeysInner />
    </AppShell>
  );
}

function KeysInner() {
  const qc = useQueryClient();
  const keys = useQuery({ queryKey: ["keys"], queryFn: () => listKeys() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (input: { providerId: string; secret: string }) => saveKey({ data: input }),
    onSuccess: async () => {
      toast.success("Key saved");
      await qc.invalidateQueries({ queryKey: ["keys"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (providerId: string) => deleteKey({ data: providerId }),
    onSuccess: async () => {
      toast.success("Key removed");
      await qc.invalidateQueries({ queryKey: ["keys"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Bring your own keys
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">API keys</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Roundtable calls the providers you seat, with the keys you paste here.
        We store them on your account and only ever show the last four digits.
        You need a key for each AI you want at the table — not all of them.
      </p>
      <div className="mt-8 space-y-4">
        {AI_PROVIDERS.map((p) => {
          const status = keys.data?.find((k) => k.providerId === p.id);
          return (
            <section
              key={p.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl tracking-tight">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {p.vendor} · {p.model}
                  </p>
                </div>
                {status?.hasKey ? (
                  <span className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-ok">
                    •••• {status.last4}
                  </span>
                ) : (
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-subtle">
                    Empty seat
                  </span>
                )}
              </div>
              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const secret = drafts[p.id]?.trim();
                  if (!secret) {
                    toast.error("Paste a key first");
                    return;
                  }
                  save.mutate(
                    { providerId: p.id, secret },
                    {
                      onSuccess: () =>
                        setDrafts((d) => ({ ...d, [p.id]: "" })),
                    },
                  );
                }}
              >
                <div className="flex-1">
                  <Label htmlFor={`key-${p.id}`} className="sr-only">
                    {p.name} API key
                  </Label>
                  <Input
                    id={`key-${p.id}`}
                    type="password"
                    autoComplete="off"
                    placeholder={p.keyHint}
                    value={drafts[p.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                    }
                  />
                </div>
                <Button type="submit" disabled={save.isPending}>
                  Save
                </Button>
                {status?.hasKey ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${p.name} key`}
                    onClick={() => remove.mutate(p.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </form>
              <a
                href={p.docs}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted underline decoration-border underline-offset-4 hover:text-fg"
              >
                Get a {p.vendor} key
                <ExternalLink className="size-3" />
              </a>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted">
        Ready?{" "}
        <Link to="/roundtable" className="text-fg underline underline-offset-4">
          Open the table
        </Link>
        .
      </p>
    </main>
  );
}
