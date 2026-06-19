import { Hono } from "hono";

// すべての /api/* をこの Worker が処理（静的アセットはアセット層が配信）。
const app = new Hono<{ Bindings: Env }>();

const api = app.basePath("/api");

// ヘルスチェック（DBに触れない・スタック疎通の確認用）
api.get("/health", (c) => c.json({ ok: true, service: "tete-api" }));

// スペース一覧は未実装。認証・認可（「このスペースのメンバーか」判定）を
// 入れるまでは、誤って全件を返さないよう 501 を返す。
// → 認証導入後、認可ミドルウェアを通したうえで実装する。
api.get("/spaces", (c) =>
  c.json({ error: "not_implemented", message: "認証導入後に有効化します" }, 501),
);

export default app;

// Hono RPC でフロントに型を渡すための型エクスポート
export type AppType = typeof app;
