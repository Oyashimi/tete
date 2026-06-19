<script setup lang="ts">
import { ref, onMounted } from "vue";

// /api/health を叩いて、Vue ↔ Hono(Worker) の疎通を確認する。
const status = ref<string>("...");

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
    <p class="tagline">手と手をつなぐ、ふたりだけの記録アプリ。</p>
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
.api {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #b0a39c;
}
</style>
