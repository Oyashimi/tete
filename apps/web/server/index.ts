import { Hono } from "hono";
import { createDb, schema } from "./db";

// すべての /api/* をこの Worker が処理（静的アセットはアセット層が配信）。
const app = new Hono<{ Bindings: Env }>();

const api = app.basePath("/api");

// ヘルスチェック
api.get("/health", (c) => c.json({ ok: true, service: "tete-api" }));

// 動作確認用：スペース一覧（※認証・認可は次ステップで追加）
// 認可レイヤー（「このスペースのメンバーか」を毎回チェック）はここに差し込む予定。
api.get("/spaces", async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(schema.spaces).limit(50);
  return c.json({ spaces: rows });
});

export default app;

// Hono RPC でフロントに型を渡すための型エクスポート
export type AppType = typeof app;
