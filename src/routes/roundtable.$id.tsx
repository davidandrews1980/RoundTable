import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthSkeleton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AI_PROVIDERS, SEAT_ROLES, providerById, roleById } from "@/lib/providers";
import { listKeys } from "@/lib/server/keys";
import {
  conveneRound,
  getTable,
  saveTableMeta,
  setSeats,
} from "@/lib/server/roundtable";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/roundtable/$id")({
  component: SittingPage,
});

function SittingPage() {
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
      <SittingInner />
    </AppShell>
  );
}

function SittingInner() {
  const { id } = Route.useParams();
  const tableId = Number(id);
  const qc = useQueryClient();
  const tableQ = useQuery({
    queryKey: ["table", tableId],
    queryFn: () => getTable({ data: tableId }),
    enabled: Number.isFinite(tableId),
  });
  const keysQ = useQuery({ queryKey: ["keys"], queryFn: () => listKeys() });
  const [prompt, setPrompt] = useState<string | null>(null);
  const [draftSeats, setDraftSeats] = useState<
    { providerId: string; role: string }[] | null
  >(null);

  const data = tableQ.data;
  const promptValue = prompt ?? data?.table.prompt ?? "";
  const seats = draftSeats ?? data?.seats ?? [];
  const keyed = useMemo(
    () => new Set((keysQ.data ?? []).filter((k) => k.hasKey).map((k) => k.providerId)),
    [keysQ.data],
  );

  const persistSeats = useMutation({
    mutationFn: (next: { providerId: string; role: string }[]) =>
      setSeats({ data: { tableId, seats: next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["table", tableId] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const convene = useMutation({
    mutationFn: async () => {
      await saveTableMeta({
        data: { id: tableId, title: data?.table.title ?? "Sitting", prompt: promptValue },
      });
      if (draftSeats) {
        await setSeats({ data: { tableId, seats: draftSeats } });
      }
      return conveneRound({ data: { tableId, prompt: promptValue } });
    },
    onSuccess: async () => {
      setDraftSeats(null);
      await qc.invalidateQueries({ queryKey: ["table", tableId] });
      await qc.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (tableQ.isPending) return <AuthSkeleton />;
  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-muted">That sitting is gone.</p>
        <Link to="/roundtable" className="mt-4 inline-block text-sm underline">
          Back to the table
        </Link>
      </main>
    );
  }

  const missing = seats.filter((s) => !keyed.has(s.providerId));
  const turnsByRound = groupTurns(data.turns);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to="/roundtable"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Sittings
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <Label htmlFor="question">Question on the table</Label>
          <Textarea
            id="question"
            className="mt-2 min-h-28 font-display text-lg"
            placeholder="What should we do — and what are we pretending not to see?"
            value={promptValue}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => convene.mutate()}
              disabled={convene.isPending || seats.length === 0}
            >
              {convene.isPending ? "The table is speaking…" : "Convene"}
            </Button>
            {missing.length > 0 ? (
              <p className="text-xs text-muted">
                {missing.length} seat{missing.length === 1 ? "" : "s"} missing a
                key.{" "}
                <Link to="/keys" className="underline underline-offset-4">
                  Add keys
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted">
                {seats.length} seated · keys on file
              </p>
            )}
          </div>

          <TableRing seats={seats} speaking={convene.isPending} />

          <div className="mt-10 space-y-10">
            {turnsByRound.length === 0 && !convene.isPending ? (
              <p className="text-sm text-muted">
                No one has spoken yet. Seat the table and convene.
              </p>
            ) : null}
            {turnsByRound.map((group) => (
              <section key={group.round}>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  Round {group.round}
                </p>
                <div className="mt-3 space-y-4">
                  {group.turns.map((t) => {
                    const p = providerById(t.providerId);
                    const r = roleById(t.role);
                    return (
                      <article
                        key={t.id}
                        className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
                      >
                        <header className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-2xl tracking-tight">
                            {p?.name ?? t.providerId}
                          </h3>
                          <span className="text-xs uppercase tracking-[0.14em] text-muted">
                            {r?.label ?? t.role}
                          </span>
                        </header>
                        {t.error ? (
                          <p className="mt-3 text-sm text-danger">{t.error}</p>
                        ) : (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                            {t.content}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-display text-2xl tracking-tight">Seats</h2>
          <p className="text-xs leading-relaxed text-muted">
            Each model takes one chair. The Chair speaks last and closes the
            loop.
          </p>
          <div className="space-y-3">
            {seats.map((seat, index) => (
              <div
                key={`${seat.providerId}-${index}`}
                className="rounded-[var(--radius-md)] border border-border bg-elevated p-3"
              >
                <label className="text-[10px] uppercase tracking-[0.14em] text-subtle">
                  Voice
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                  value={seat.providerId}
                  onChange={(e) => {
                    const next = seats.map((s, i) =>
                      i === index ? { ...s, providerId: e.target.value } : s,
                    );
                    setDraftSeats(next);
                    persistSeats.mutate(next);
                  }}
                >
                  {AI_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.vendor}
                      {keyed.has(p.id) ? "" : " (no key)"}
                    </option>
                  ))}
                </select>
                <label className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-subtle">
                  Role
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                  value={seat.role}
                  onChange={(e) => {
                    const next = seats.map((s, i) =>
                      i === index ? { ...s, role: e.target.value } : s,
                    );
                    setDraftSeats(next);
                    persistSeats.mutate(next);
                  }}
                >
                  {SEAT_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="mt-2 text-xs text-muted hover:text-fg"
                  onClick={() => {
                    const next = seats.filter((_, i) => i !== index);
                    setDraftSeats(next);
                    if (next.length) persistSeats.mutate(next);
                  }}
                >
                  Remove seat
                </button>
              </div>
            ))}
          </div>
          {seats.length < 6 ? (
            <Button
              variant="secondary"
              onClick={() => {
                const used = new Set(seats.map((s) => s.providerId));
                const nextP = AI_PROVIDERS.find((p) => !used.has(p.id));
                const usedRoles = new Set(seats.map((s) => s.role));
                const nextR = SEAT_ROLES.find((r) => !usedRoles.has(r.id)) ?? SEAT_ROLES[0];
                if (!nextP) return;
                const next = [...seats, { providerId: nextP.id, role: nextR.id }];
                setDraftSeats(next);
                persistSeats.mutate(next);
              }}
            >
              Add a seat
            </Button>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function TableRing({
  seats,
  speaking,
}: {
  seats: { providerId: string; role: string }[];
  speaking: boolean;
}) {
  return (
    <div className="relative mx-auto mt-10 aspect-square w-full max-w-md">
      <div className="absolute inset-[18%] rounded-full border border-line bg-elevated" />
      <div className="absolute inset-[32%] rounded-full border border-border bg-surface" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-sm italic text-muted">
          {speaking ? "Listening…" : "The table"}
        </span>
      </div>
      {seats.map((seat, i) => {
        const angle = (i / Math.max(seats.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 42;
        const y = 50 + Math.sin(angle) * 42;
        const p = providerById(seat.providerId);
        const r = roleById(seat.role);
        return (
          <div
            key={`${seat.providerId}-${i}`}
            className={cn(
              "absolute w-24 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] border border-border bg-bg px-2 py-1.5 text-center",
              speaking && "animate-pulse",
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <p className="truncate text-xs font-medium text-fg">{p?.name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.12em] text-subtle">
              {r?.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function groupTurns(
  turns: {
    id: number;
    providerId: string;
    role: string;
    round: number;
    content: string;
    error: string | null;
    createdAt: string;
  }[],
) {
  const map = new Map<number, typeof turns>();
  for (const t of turns) {
    const list = map.get(t.round) ?? [];
    list.push(t);
    map.set(t.round, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, group]) => ({ round, turns: group }));
}
