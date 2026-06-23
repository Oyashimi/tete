import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cloudflare } from "@cloudflare/vite-plugin";

// Vue(フロント) と Hono(Worker) を1つにまとめてビルド/デプロイする。
// cloudflare() が wrangler.jsonc を読み、server/index.ts を Worker として扱う。
export default defineConfig({
  plugins: [vue(), cloudflare()],
  server: {
    host: true, // 0.0.0.0 にバインドし、同一LAN内の他端末（スマホ等）からアクセス可能にする
  },
});
