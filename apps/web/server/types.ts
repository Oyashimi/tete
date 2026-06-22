import type { Space } from "@tete/shared";
import type { Auth } from "./auth";
import type { Db } from "./db";

// Better Auth のセッション解決結果から user / session の型を取り出す。
type SessionResult = Awaited<ReturnType<Auth["api"]["getSession"]>>;
export type SessionUser = NonNullable<SessionResult>["user"];
export type SessionData = NonNullable<SessionResult>["session"];

// Hono context に載せる値。
// - db / user / session: セッション解決ミドルウェアが全 /api リクエストで設定
// - space: requireSpaceMember が検証成功時のみ設定（未通過ルートでは undefined）
export type Variables = {
  db: Db;
  user: SessionUser | null;
  session: SessionData | null;
  space?: Space;
};

export type HonoEnv = { Bindings: Env; Variables: Variables };
