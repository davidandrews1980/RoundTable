import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const getPrefs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      roundtable_briefing_seen: boolean;
    }>`select roundtable_briefing_seen from user_prefs where user_id = ${context.userId}`;
    return {
      briefingSeen: Boolean(rows[0]?.roundtable_briefing_seen),
    };
  });

export const markBriefingSeen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`
      insert into user_prefs (user_id, roundtable_briefing_seen)
      values (${context.userId}, true)
      on conflict (user_id) do update set roundtable_briefing_seen = true
    `;
    return { ok: true as const };
  });
