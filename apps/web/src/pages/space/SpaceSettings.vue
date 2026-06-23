<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { useSpace } from "../../composables/useSpace";

// 設定タブ。アカウント・スペース・プラン・サポート・危険操作をまとめる。
// 【モック】各操作はまだ繋がない（デザイン段階）。ログアウトのみ画面遷移する。
const route = useRoute();
const router = useRouter();
const { user } = useCurrentUser();
const { space } = useSpace(String(route.params.id));

// アバター用のイニシャル（画像が無いとき）。
const initial = computed(() => user.value.name.slice(0, 1));

const startedOnLabel = computed(() => space.value?.startedOn ?? "未設定");

function logout() {
  // TODO: API 紐付け時に auth-client の signOut() を呼ぶ。
  router.push({ name: "home" });
}
</script>

<template>
  <div class="page">
    <header class="bar"><h1>設定</h1></header>

    <!-- アカウント -->
    <section class="group">
      <p class="group-label">アカウント</p>
      <div class="card account">
        <span class="avatar">{{ initial }}</span>
        <div class="account-info">
          <span class="name">{{ user.name }}</span>
          <span class="email">{{ user.email }}</span>
        </div>
      </div>
      <button class="card row danger-text" @click="logout">
        <span>ログアウト</span>
      </button>
    </section>

    <!-- このスペース -->
    <section class="group">
      <p class="group-label">このスペース</p>
      <div class="card list">
        <button class="row">
          <span class="row-label">相手</span>
          <span class="row-value">
            {{ space?.isPaired ? space?.partnerName : "招待する" }}
            <span class="chev">›</span>
          </span>
        </button>
        <button class="row">
          <span class="row-label">付き合った日</span>
          <span class="row-value">{{ startedOnLabel }}<span class="chev">›</span></span>
        </button>
        <button class="row">
          <span class="row-label">スペース名</span>
          <span class="row-value"
            >{{ space?.displayName ?? "未設定" }}<span class="chev">›</span></span
          >
        </button>
      </div>
    </section>

    <!-- プラン -->
    <section class="group">
      <p class="group-label">プラン</p>
      <div class="card list">
        <button class="row">
          <span class="row-label">現在のプラン</span>
          <span class="row-value"
            ><span class="badge">無料</span><span class="chev">›</span></span
          >
        </button>
        <button class="row">
          <span class="row-label">アップグレード</span>
          <span class="row-value muted"
            >複数人モード・ステルス<span class="chev">›</span></span
          >
        </button>
      </div>
    </section>

    <!-- サポート -->
    <section class="group">
      <p class="group-label">サポート</p>
      <div class="card list">
        <button class="row"><span class="row-label">ヘルプ</span><span class="chev">›</span></button>
        <button class="row"><span class="row-label">利用規約</span><span class="chev">›</span></button>
        <button class="row">
          <span class="row-label">プライバシーポリシー</span><span class="chev">›</span>
        </button>
      </div>
    </section>

    <!-- 危険ゾーン -->
    <section class="group">
      <p class="group-label">その他</p>
      <div class="card list">
        <button v-if="space?.isPaired" class="row danger-text">
          <span class="row-label">ペアを解除する</span>
        </button>
        <button class="row danger-text">
          <span class="row-label">スペースをアーカイブ</span>
        </button>
      </div>
    </section>

    <p class="version">tete · v0.0.0</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-8);
}
.bar {
  padding: var(--space-4) 0;
}
.bar h1 {
  margin: 0;
  font-size: 1.2rem;
}

.group {
  margin-bottom: var(--space-6);
}
.group-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 0 0 var(--space-2);
  padding-left: var(--space-1);
  letter-spacing: 0.04em;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* アカウントカード */
.account {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent-ink);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.1rem;
}
.account-info {
  display: flex;
  flex-direction: column;
}
.name {
  font-weight: 600;
}
.email {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* リスト行 */
.list .row + .row {
  border-top: 1px solid var(--border);
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  background: none;
  border: none;
  padding: var(--space-4);
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}
.row-label {
  font-weight: 500;
}
.row-value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: 0.85rem;
}
.row-value.muted {
  color: var(--text-faint);
}
.chev {
  color: var(--text-faint);
  font-size: 1.1rem;
  line-height: 1;
}
.badge {
  background: var(--surface-sub);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0.1rem 0.55rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 危険操作・ログアウト */
.danger-text {
  color: #c0564f;
}
.card.row {
  width: 100%;
  margin-bottom: 0;
}

.version {
  text-align: center;
  color: var(--text-faint);
  font-size: 0.75rem;
  margin-top: var(--space-8);
}
</style>
