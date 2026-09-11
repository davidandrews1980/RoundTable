import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { AI_PROVIDERS, SEAT_ROLES } from "@/lib/providers";
import { callSeatedModel } from "@/lib/server/call-model";
import { loadUserSecrets } from "@/lib/server/keys";

export type TableRow = {
  id: number;
  title: string;
  prompt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SeatRow = {
  id: number;
  providerId: string;
  role: string;
  sortOrder: number;
};

export type TurnRow = {
  id: number;
  providerId: string;
  role: string;
  round: number;
  content: string;
  error: string | null;
  createdAt: string;
};

function asTable(r: {
  id: number;
  title: string;
  prompt: string;
  status: string;
  created_at: string;
  updated_at: string;
}): TableRow {
  return {
    id: r.id,
    title: r.title,
    prompt: r.prompt,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const listTables = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      title: string;
      prompt: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>`select id, title, prompt, status, created_at, updated_at from tables where user_id = ${context.userId} order by updated_at desc`;
    return rows.map(asTable);
  });

export const createTable = createServerFn({ method: "POST" })
  .validator((title?: string) => (title ?? "Untitled session").trim() || "Untitled session")
  .middleware([authMiddleware])
  .handler(async ({ context, data: title }) => {
    const sql = await getSql();
    const inserted = await sql<{ id: number }>`
      insert into tables (user_id, title) values (${context.userId}, ${title}) returning id
    `;
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not open a table");
    const defaults: { providerId: string; role: string }[] = [
      { providerId: "xai", role: "chair" },
      { providerId: "anthropic", role: "counsel" },
      { providerId: "openai", role: "engineer" },
      { providerId: "deepseek", role: "skeptic" },
    ];
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      await sql`
        insert into seats (table_id, user_id, provider_id, role, sort_order)
        values (${id}, ${context.userId}, ${d.providerId}, ${d.role}, ${i})
      `;
    }
    return { id };
  });

export const getTable = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const tables = await sql<{
      id: number;
      title: string;
      prompt: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>`select id, title, prompt, status, created_at, updated_at from tables where id = ${id} and user_id = ${context.userId}`;
    const table = tables[0];
    if (!table) return null;
    const seats = await sql<{
      id: number;
      provider_id: string;
      role: string;
      sort_order: number;
    }>`select id, provider_id, role, sort_order from seats where table_id = ${id} and user_id = ${context.userId} order by sort_order`;
    const turns = await sql<{
      id: number;
      provider_id: string;
      role: string;
      round: number;
      content: string;
      error: string | null;
      created_at: string;
    }>`select id, provider_id, role, round, content, error, created_at from turns where table_id = ${id} and user_id = ${context.userId} order by round, id`;
    return {
      table: asTable(table),
      seats: seats.map((s) => ({
        id: s.id,
        providerId: s.provider_id,
        role: s.role,
        sortOrder: s.sort_order,
      })) satisfies SeatRow[],
      turns: turns.map((t) => ({
        id: t.id,
        providerId: t.provider_id,
        role: t.role,
        round: t.round,
        content: t.content,
        error: t.error,
        createdAt: t.created_at,
      })) satisfies TurnRow[],
    };
  });

export const saveTableMeta = createServerFn({ method: "POST" })
  .validator((input: { id: number; title: string; prompt: string }) => ({
    id: input.id,
    title: input.title.trim() || "Untitled session",
    prompt: input.prompt,
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update tables set title = ${data.title}, prompt = ${data.prompt}, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const setSeats = createServerFn({ method: "POST" })
  .validator((input: { tableId: number; seats: { providerId: string; role: string }[] }) => {
    const seats = input.seats
      .filter(
        (s) =>
          AI_PROVIDERS.some((p) => p.id === s.providerId) &&
          SEAT_ROLES.some((r) => r.id === s.role),
      )
      .slice(0, 6);
    if (seats.length < 1) throw new Error("Seat at least one voice");
    const seen = new Set<string>();
    for (const s of seats) {
      if (seen.has(s.providerId)) throw new Error("Each model can only take one seat");
      seen.add(s.providerId);
    }
    return { tableId: input.tableId, seats };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: number }>`select id from tables where id = ${data.tableId} and user_id = ${context.userId}`;
    if (!owned[0]) throw new Error("Table not found");
    await sql`delete from seats where table_id = ${data.tableId} and user_id = ${context.userId}`;
    for (let i = 0; i < data.seats.length; i++) {
      const s = data.seats[i];
      await sql`
        insert into seats (table_id, user_id, provider_id, role, sort_order)
        values (${data.tableId}, ${context.userId}, ${s.providerId}, ${s.role}, ${i})
      `;
    }
    return { ok: true as const };
  });

export const deleteTable = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from tables where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const conveneRound = createServerFn({ method: "POST" })
  .validator((input: { tableId: number; prompt: string }) => ({
    tableId: input.tableId,
    prompt: input.prompt.trim(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (data.prompt.length < 8) {
      throw new Error("Put a real question on the table");
    }
    const sql = await getSql();
    const owned = await sql<{ id: number }>`select id from tables where id = ${data.tableId} and user_id = ${context.userId}`;
    if (!owned[0]) throw new Error("Table not found");

    const seats = await sql<{
      provider_id: string;
      role: string;
      sort_order: number;
    }>`select provider_id, role, sort_order from seats where table_id = ${data.tableId} and user_id = ${context.userId} order by sort_order`;
    if (seats.length === 0) throw new Error("Seat someone first");

    const secrets = await loadUserSecrets(context.userId);
    const missing = seats
      .map((s) => s.provider_id)
      .filter((id) => !secrets.has(id));
    if (missing.length === seats.length) {
      throw new Error("Add API keys for the seats you filled");
    }

    const roundRows = await sql<{ max: number | null }>`
      select max(round) as max from turns where table_id = ${data.tableId} and user_id = ${context.userId}
    `;
    const round = (roundRows[0]?.max ?? 0) + 1;

    await sql`
      update tables set prompt = ${data.prompt}, status = 'running', title = ${titleFrom(data.prompt)}, updated_at = now()
      where id = ${data.tableId} and user_id = ${context.userId}
    `;

    const speaking = seats.filter((s) => s.role !== "chair" || seats.length === 1);
    const chair = seats.find((s) => s.role === "chair");

    const spoken = await Promise.all(
      speaking.map(async (seat) => {
        const key = secrets.get(seat.provider_id);
        const name =
          AI_PROVIDERS.find((p) => p.id === seat.provider_id)?.name ??
          seat.provider_id;
        if (!key) {
          return {
            seat,
            name,
            text: "",
            error: "No API key for this seat" as string | null,
          };
        }
        try {
          const { text } = await callSeatedModel({
            providerId: seat.provider_id,
            apiKey: key,
            role: seat.role,
            question: data.prompt,
          });
          return { seat, name, text, error: null as string | null };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Call failed";
          return { seat, name, text: "", error: message };
        }
      }),
    );

    for (const result of spoken) {
      await sql`
        insert into turns (table_id, user_id, provider_id, role, round, content, error)
        values (
          ${data.tableId},
          ${context.userId},
          ${result.seat.provider_id},
          ${result.seat.role},
          ${round},
          ${result.text},
          ${result.error}
        )
      `;
    }

    const prior = spoken
      .filter((r) => r.text)
      .map((r) => ({ name: r.name, role: r.seat.role, content: r.text }));

    if (
      chair &&
      secrets.has(chair.provider_id) &&
      speaking.some((s) => s.provider_id !== chair.provider_id)
    ) {
      try {
        const { text } = await callSeatedModel({
          providerId: chair.provider_id,
          apiKey: secrets.get(chair.provider_id)!,
          role: "chair",
          question: data.prompt,
          prior,
          synthesize: true,
        });
        await sql`
          insert into turns (table_id, user_id, provider_id, role, round, content, error)
          values (${data.tableId}, ${context.userId}, ${chair.provider_id}, ${chair.role}, ${round}, ${text}, ${null})
        `;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Call failed";
        await sql`
          insert into turns (table_id, user_id, provider_id, role, round, content, error)
          values (${data.tableId}, ${context.userId}, ${chair.provider_id}, ${chair.role}, ${round}, ${""}, ${message})
        `;
      }
    }

    await sql`
      update tables set status = 'open', updated_at = now()
      where id = ${data.tableId} and user_id = ${context.userId}
    `;
    return { ok: true as const, round };
  });

function titleFrom(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 48) return cleaned;
  return `${cleaned.slice(0, 45).trim()}…`;
}
