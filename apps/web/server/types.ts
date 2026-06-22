import type { Auth } from "./auth";
import type { Db } from "./db";
import type { spaces } from "./db/schema";

// Better Auth のセッション解決結果から user / session の型を取り出す。
type SessionResult = Awaited<ReturnType<Auth["api"]["getSession"]>>;
export type SessionUser = NonNullable<SessionResult>["user"];
export type SessionData = NonNullable<SessionResult>["session"];

// Hono context に載せる値。
// - db / user / session: セッション解決ミドルウェアが全 /api リクエストで設定
// - space: requireSpaceMember が検証成功時に設定（それ以外のルートでは未設定）
export type Variables = {
  db: Db;
  user: SessionUser | null;
  session: SessionData | null;
  space: typeof spaces.$inferSelect;
};

export type HonoEnv = { Bindings: Env; Variables: Variables };
