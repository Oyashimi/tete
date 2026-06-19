import { defineConfig } from "drizzle-kit";

// `npm run db:generate` でスキーマ差分から SQL マイグレーションを生成。
// 適用は wrangler 経由（D1）：`npm run db:migrate:local` / `:remote`
export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
});
