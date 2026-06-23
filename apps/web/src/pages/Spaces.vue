<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCurrentUser } from "../composables/useCurrentUser";
import { useSpaces } from "../composables/useSpaces";
import type { SpaceView } from "../lib/mock";

// ログイン後の入口（複数スペースを持つ＝課金者向けの切替画面）。
// 自分の「スペース（箱）」を並べ、選んで中へ入る。
// 【モック】user / spaces はダミー composable から取得（API 紐付けは後工程）。
const router = useRouter();
const { user } = useCurrentUser();
const { spaces, isPending } = useSpaces();

// 表示名：明示ラベルがあればそれ、無ければ既定文言。
function spaceTitle(s: SpaceView): string {
  return s.displayName ?? "ふたりのスペース";
}

// 付き合った日からの日数（当日を1日目とする）。startedOn 未設定なら null。
function daysTogether(s: SpaceView): number | null {
  if (!s.startedOn) return null;
  const start = new Date(s.startedOn).getTime();
  if (Number.isNaN(start)) return null;
  const diff = Date.now() - start;
  return Math.max(0, Math.floor(diff / 86_400_000)) + 1;
}

function openSpace(s: SpaceView) {
  router.push({ name: "space", params: { id: s.id } });
}
</script>

<template>
  <main class="wrap">
    <header class="head">
      <p class="hello">こんにちは、{{ user.name }} さん</p>
      <h1>あなたのスペース</h1>
    </header>

    <p v-if="isPending" class="muted">読み込み中…</p>

    <ul v-else class="grid">
      <li
        v-for="s in spaces"
        :key="s.id"
        class="card"
        :class="{ couple: s.isPaired }"
        @click="openSpace(s)"
      >
        <span class="badge">{{ s.isPaired ? "ふたり" : "じぶん" }}</span>
        <span class="emoji">{{ s.isPaired ? "🤝" : "🌱" }}</span>
        <span class="title">{{
          s.isPaired && s.partnerName
            ? `${s.partnerName} ＆ じぶん`
            : spaceTitle(s)
        }}</span>
        <span v-if="daysTogether(s)" class="days"
          >いっしょに {{ daysTogether(s) }} 日目</span
        >
        <span v-else class="days">まだ一人・招待待ち</span>
      </li>

      <!-- 新規作成（無料プランは1つまで。いまは見た目のみ） -->
      <li class="card add" @click="() => {}">
        <span class="emoji">＋</span>
        <span class="title">新しいスペース</span>
        <span class="days">招待リンクで相手と共有</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.wrap {
  min-height: 100dvh;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4) var(--space-8);
}
.head {
  margin-bottom: var(--space-6);
}
.hello {
  margin: 0 0 var(--space-1);
  font-size: 0.9rem;
  color: var(--text-muted);
}
.head h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.04em;
}
.muted {
  color: var(--text-muted);
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
}
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 150px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.badge {
  align-self: flex-end;
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--surface-sub);
  border: 1px solid var(--border);
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-pill);
}
.card.couple .badge {
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-color: var(--accent-soft);
}
.emoji {
  font-size: 1.9rem;
  line-height: 1;
}
.title {
  font-size: 1.05rem;
  font-weight: 600;
}
.days {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.card.add {
  background: none;
  border: 1px dashed var(--border-strong);
  box-shadow: none;
  color: var(--text-faint);
  justify-content: center;
  align-items: center;
  text-align: center;
}
.card.add:hover {
  border-color: var(--accent);
  color: var(--accent-ink);
  transform: translateY(-3px);
  box-shadow: none;
}
.card.add .emoji {
  font-size: 1.6rem;
}
</style>
