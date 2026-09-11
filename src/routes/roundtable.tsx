import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, AuthSkeleton } from "@/components/app-shell";
import { RoundtableBriefing } from "@/components/briefing";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPrefs, markBriefingSeen } from "@/lib/server/prefs";
import { createTable, deleteTable, listTables } from "@/lib/server/roundtable";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/roundtable")({
  component: RoundtableIndex,
});

function RoundtableIndex() {
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
      <RoundtableGate />
    </AppShell>
  );
}

function RoundtableGate() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const prefs = useQuery({ queryKey: ["prefs"], queryFn: () => getPrefs() });
  const tables = useQuery({
    queryKey: ["tables"],
    queryFn: () => listTables(),
    enabled: Boolean(prefs.data?.briefingSeen),
  });

  const ack = useMutation({
    mutationFn: () => markBriefingSeen(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["prefs"] });
      await navigate({ to: "/keys" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const create = useMutation({
    mutationFn: () => createTable({ data: "New sitting" }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["tables"] });
      await navigate({ to: "/roundtable/$id", params: { id: String(res.id) } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteTable({ data: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  if (prefs.isPending) return <AuthSkeleton />;
  if (!prefs.data?.briefingSeen) {
    return <RoundtableBriefing onContinue={() => ack.mutate()} busy={ack.isPending} />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Roundtable
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Sittings</h1>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="size-4" />
          New sitting
        </Button>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Each sitting is a private table. Seat the models you have keys for, put
        a question in the center, and convene.
      </p>
      <div className="mt-8 space-y-3">
        {tables.data && tables.data.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-5 py-10 text-sm text-muted">
            No sittings yet. Open a table when you have at least one key.
          </p>
        ) : null}
        {tables.data?.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3"
          >
            <Link
              to="/roundtable/$id"
              params={{ id: String(t.id) }}
              className="min-w-0 flex-1"
            >
              <p className="truncate font-medium text-fg">{t.title}</p>
              <p className="truncate text-xs text-muted">
                {t.prompt || "No question yet"}
              </p>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete sitting"
              onClick={() => remove.mutate(t.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
