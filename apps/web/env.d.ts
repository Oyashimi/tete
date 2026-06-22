/// <reference types="vite/client" />

// Worker のバインディング型。`npm run cf-typegen` で wrangler が自動生成する版に
// 置き換え可能だが、まずは手書きで最低限を定義しておく。
interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  // 認証（Better Auth）。値は .dev.vars（ローカル）／wrangler secret（本番）で注入。
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

// .vue ファイルを TS から import できるように
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
