<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSession, signOut, signInWithGoogle } from "../lib/auth-client";

// /api/health を叩いて、Vue ↔ Hono(Worker) の疎通を確認する。
const status = ref<string>("...");

// Better Auth のセッション（リアクティブ）。ログイン中ならユーザー情報が入る。
const session = useSession();

onMounted(async () => {
  try {
    const res = await fetch("/api/health");
    const data = (await res.json()) as { ok: boolean; service: string };
    status.value = data.ok ? `🟢 ${data.service}` : "🔴 down";
  } catch {
    status.value = "🔴 接続できませんでした";
  }
});
</script>

<template>
  <main class="wrap">
    <h1>tete</h1>
    <!-- <p class="tagline">手と手をつなぐ、ふたりだけの記録アプリ。</p> -->

    <div class="auth">
      <template v-if="session.isPending">
        <p class="muted">確認中…</p>
      </template>
      <template v-else-if="session.data">
        <p class="hello">こんにちは、{{ session.data.user.name }} さん</p>
        <button class="btn ghost" @click="signOut()">ログアウト</button>
      </template>
      <template v-else>
        <button class="btn" @click="signInWithGoogle()">Googleでログイン</button>
      </template>
    </div>

    <p class="api">API: {{ status }}</p>
  </main>
</template>

<style scoped>
.wrap {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  padding: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 2.5rem;
  letter-spacing: 0.05em;
}
.tagline {
  color: #8a7a72;
  margin: 0;
}
.auth {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.hello {
  margin: 0;
  color: #6b5b53;
}
.muted {
  margin: 0;
  color: #b0a39c;
}
.btn {
  border: none;
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
  background: #e8a0a8;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn.ghost {
  background: transparent;
  color: #8a7a72;
  border: 1px solid #e0d5cf;
}
.api {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #b0a39c;
}
</style>
