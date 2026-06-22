import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import type { Space } from "@tete/shared";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { spaceMembers, spaces } from "./db/schema";
import { requireAuth, requireSpaceMember } from "./middleware";
import type { HonoEnv } from "./types";

// すべての /api/* をこの Worker が処理（静的アセットはアセット層が配信）。
const app = new Hono<HonoEnv>();

// ── Better Auth ハンドラ（/api/auth/*） ───────────────────────────
// サインイン・コールバック・サインアウト等をすべて Better Auth に委任。
// 同一オリジンなので httpOnly Cookie がそのまま効く（strategy.md の統合構成の狙い）。
// セッション解決ミドルウェアより前に登録し、auth 経路では二重処理しない。
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const db = createDb(c.env.DB);
  return createAuth(c.env, db).handler(c.req.raw);
});

const api = app.basePath("/api");

// ── セッション解決ミドルウェア ────────────────────────────────────
// 1リクエスト1つの DB クライアントを作って context に載せ、Cookie から
// セッションを引いて user/session を設定する（無ければ null）。
api.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

// ヘルスチェック（DBに触れない・スタック疎通の確認用）
api.get("/health", (c) => c.json({ ok: true, service: "tete-api" }));

// ログイン中のユーザーを返す（認証配線の動作確認用）。未ログインは user: null。
api.get("/me", (c) => c.json({ user: c.get("user") }));

// ── スペース ──────────────────────────────────────────────────────
// 自分が「現役メンバー」のスペース一覧（退出済み・アーカイブ済みは除外）。
api.get("/spaces", requireAuth, async (c) => {
  const user = c.get("user")!;
  const db = c.get("db");
  const rows = await db
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
        eq(spaceMembers.userId, user.id),
        isNull(spaceMembers.leftAt),
        isNull(spaces.deletedAt),
      ),
    );
  return c.json({ spaces: rows satisfies Space[] });
});

// 単一スペース取得。requireSpaceMember がメンバーシップを検証し space を載せる。
api.get("/spaces/:spaceId", requireSpaceMember, (c) =>
  c.json({ space: c.get("space") }),
);

export default app;

// Hono RPC でフロントに型を渡すための型エクスポート
export type AppType = typeof app;
