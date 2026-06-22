import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, type Db } from "./db";
import {
  accounts,
  sessions,
  spaceMembers,
  spaces,
  users,
  verifications,
} from "./db/schema";

// Cloudflare Workers では D1 などのバインディングがリクエスト時にしか取れないため、
// auth インスタンスはシングルトンにせず「リクエストごとに env から生成」する。
// （シングルトンにすると D1 バインディングを掴めず静かに壊れる）
// db はリクエスト内で使い回せるよう外から渡せる（1リクエスト1インスタンスが原則）。
export function createAuth(env: Env, db: Db = createDb(env.DB)) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      // モデル名 → Drizzle テーブルを明示マッピング（命名の食い違いを防ぐ）。
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),
    // Googleログインのみ（strategy.md の認証設計）。
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    databaseHooks: {
      user: {
        create: {
          // 新規ユーザーには「自分の箱」を1つ自動作成し、本人をメンバーにする。
          // strategy.md：サインアップ時点で1人用スペースができ、招待で相手が合流して
          // 共有（カップル）になる。kind は既定の 'couple'（2人前提で1人から始まる箱）。
          // ※ 招待リンク経由の参加フロー実装時に、この自動生成との関係を再検討する。
          after: async (user) => {
            const spaceId = crypto.randomUUID();
            await db.insert(spaces).values({ id: spaceId });
            await db
              .insert(spaceMembers)
              .values({ userId: user.id, spaceId });
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
