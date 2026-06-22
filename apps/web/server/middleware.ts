import { and, eq, isNull } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { spaceMembers, spaces } from "./db/schema";
import type { HonoEnv } from "./types";

// ログイン必須。未ログインは 401。
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  if (!c.get("user")) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

// :spaceId のスペースに、ログイン中ユーザーが「現役メンバー」として属しているか検証。
// 通れば c.set("space", ...) で対象スペースを context に載せる。
//
// 非メンバーには 403 ではなく 404 を返す：403 は「存在はする」という事実を漏らし、
// strategy.md の秘匿原則（他人の箱の存在を構造的に観測させない）に反するため。
export const requireSpaceMember = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const spaceId = c.req.param("spaceId");
  if (!spaceId) {
    return c.json({ error: "not_found" }, 404);
  }
  const db = c.get("db");
  // 一覧（/api/spaces）と同じ Space 契約に揃えて取得する。
  // deletedAt 等の内部列を漏らさず、joinedAt を含めるため列を明示的に投影する。
  const [space] = await db
    .select({
      id: spaces.id,
      kind: spaces.kind,
      displayName: spaces.displayName,
      startedOn: spaces.startedOn,
      createdAt: spaces.createdAt,
      joinedAt: spaceMembers.joinedAt,
    })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
    .where(
      and(
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.userId, user.id),
        isNull(spaceMembers.leftAt), // 退出済みメンバーは不可
        isNull(spaces.deletedAt), // アーカイブ済みスペースは不可
      ),
    )
    .limit(1);

  if (!space) {
    return c.json({ error: "not_found" }, 404);
  }

  c.set("space", space);
  await next();
});
