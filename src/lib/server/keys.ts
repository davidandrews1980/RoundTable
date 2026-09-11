import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { AI_PROVIDERS } from "@/lib/providers";

function last4Of(secret: string) {
  const trimmed = secret.trim();
  if (trimmed.length < 4) return "••••";
  return trimmed.slice(-4);
}

export type KeyStatus = {
  providerId: string;
  last4: string;
  hasKey: boolean;
};

export const listKeys = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      provider_id: string;
      last4: string;
    }>`select provider_id, last4 from api_keys where user_id = ${context.userId}`;
    const byId = new Map(rows.map((r) => [r.provider_id, r.last4]));
    return AI_PROVIDERS.map((p) => ({
      providerId: p.id,
      last4: byId.get(p.id) ?? "",
      hasKey: byId.has(p.id),
    })) satisfies KeyStatus[];
  });

export const saveKey = createServerFn({ method: "POST" })
  .validator((input: { providerId: string; secret: string }) => {
    const providerId = input.providerId.trim();
    const secret = input.secret.trim();
    if (!AI_PROVIDERS.some((p) => p.id === providerId)) {
      throw new Error("Unknown provider");
    }
    if (secret.length < 8) {
      throw new Error("That key is too short to be real");
    }
    return { providerId, secret };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const last4 = last4Of(data.secret);
    await sql`
      insert into api_keys (user_id, provider_id, secret, last4)
      values (${context.userId}, ${data.providerId}, ${data.secret}, ${last4})
      on conflict (user_id, provider_id)
      do update set secret = excluded.secret, last4 = excluded.last4
    `;
    return { ok: true as const, last4 };
  });

export const deleteKey = createServerFn({ method: "POST" })
  .validator((providerId: string) => providerId.trim())
  .middleware([authMiddleware])
  .handler(async ({ context, data: providerId }) => {
    const sql = await getSql();
    await sql`delete from api_keys where user_id = ${context.userId} and provider_id = ${providerId}`;
    return { ok: true as const };
  });

export async function loadUserSecrets(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    provider_id: string;
    secret: string;
  }>`select provider_id, secret from api_keys where user_id = ${userId}`;
  return new Map(rows.map((r) => [r.provider_id, r.secret]));
}
