<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSpace } from "../../composables/useSpace";
import {
  countdownLabel,
  useAnniversaries,
} from "../../composables/useAnniversaries";
import { SHARED_FEATURES, PERSONAL_FEATURES } from "../../lib/features";

// スペース（箱）内のホームタブ。各機能への入口を並べる。
// 【モック】space はダミー composable から取得（API 紐付けは後工程）。
const route = useRoute();
const router = useRouter();
const spaceId = computed(() => String(route.params.id));
const { space, daysTogether } = useSpace(spaceId.value);

// 共有機能・個人機能ともに常に全項目を表示する。
const sharedFeatures = SHARED_FEATURES;
const personalFeatures = PERSONAL_FEATURES;

// タイルの遷移先（route があれば対応するタブへ）。未設定なら準備中で何もしない。
function openFeature(routeName?: string) {
  if (!routeName) return;
  router.push({ name: routeName, params: { id: spaceId.value } });
}
// ホームに出す記念日（記念日画面でピン留めした1件）。
const { pinned: pinnedAnniversary } = useAnniversaries(spaceId.value);

const headerTitle = computed(() => {
  if (!space.value) return "tete";
  if (space.value.isPaired && space.value.partnerName) {
    return `${space.value.partnerName} ＆ じぶん`;
  }
  return space.value.displayName ?? "ふたりのスペース";
});
</script>

<template>
  <div class="page" v-if="space">
    <header class="bar">
      <span class="brand">{{ headerTitle }}</span>
      <button
        class="settings-btn"
        aria-label="設定"
        @click="openFeature('space-settings')"
      >
        ⚙
      </button>
    </header>

    <!-- ヒーロー：2人＝日数カウンター / ソロ＝箱名 -->
    <section class="hero">
      <template v-if="space.isPaired && daysTogether">
        <p class="hero-label">つきあって</p>
        <p class="hero-count">{{ daysTogether }}<span class="unit">日</span></p>
      </template>
      <template v-else>
        <p class="hero-title">ふたりのスペース</p>
        <p class="hero-sub">まだあなた一人。相手を招待すると2人の箱になります</p>
      </template>
    </section>

    <!-- ソロ状態だけ：招待 CTA -->
    <button v-if="!space.isPaired" class="invite">
      <span class="invite-main">🔗 相手を招待する</span>
      <span class="invite-hint">リンクを送ると、この箱が2人で共有されます</span>
    </button>

    <!-- 2人状態：ピン留めした記念日のカウントダウン（タップで記念日画面へ） -->
    <button v-else class="summary" @click="openFeature('space-anniversary')">
      <template v-if="pinnedAnniversary">
        <span class="ico">🎉</span>
        <span class="summary-main">{{ pinnedAnniversary.title }}</span>
        <span class="summary-count">{{ countdownLabel(pinnedAnniversary) }}</span>
      </template>
      <template v-else>
        <span class="ico">🎉</span>
        <span class="summary-main muted">記念日をホームに表示</span>
        <span class="summary-count muted">選ぶ ›</span>
      </template>
    </button>

    <!-- 共有機能 -->
    <p class="section-label">共有</p>
    <ul class="tiles">
      <li
        v-for="f in sharedFeatures"
        :key="f.key"
        class="tile shared"
        :class="{ wide: f.wide }"
        @click="openFeature(f.route)"
      >
        <span class="ico">{{ f.icon }}</span>
        <span class="tile-label">{{ f.label }}</span>
      </li>
    </ul>

    <!-- 個人機能（相手には見えない・常に全項目を表示） -->
    <p class="section-label">
      じぶん用 <span class="muted">・相手に見えません</span>
    </p>
    <ul class="tiles">
      <li
        v-for="f in personalFeatures"
        :key="f.key"
        class="tile personal"
        :class="{ wide: f.wide }"
        @click="openFeature(f.route)"
      >
        <span class="ico">{{ f.icon }}</span>
        <span class="tile-label">{{ f.label }}</span>
      </li>
    </ul>
  </div>

  <div class="page" v-else>
    <p class="muted">スペースが見つかりませんでした。</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-8);
}

/* ヘッダー */
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  background: var(--bg);
}
.brand {
  font-weight: 600;
  font-size: 0.95rem;
}
/* 設定への入口（フッターから移設） */
.settings-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 4px;
  color: var(--text-muted);
  filter: grayscale(1);
  opacity: 0.7;
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.settings-btn:hover {
  opacity: 1;
  transform: rotate(30deg);
}

/* ヒーロー */
.hero {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  padding: var(--space-8) var(--space-4);
  margin-bottom: var(--space-4);
}
.hero-label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
.hero-count {
  margin: var(--space-1) 0 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text);
}
.hero-count .unit {
  font-size: 1.1rem;
  font-weight: 500;
  margin-left: 0.15em;
  color: var(--text-muted);
}
.hero-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}
.hero-sub {
  margin: var(--space-2) 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* 招待 CTA（差し色ピンクはここで効かせる） */
.invite {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  text-align: center;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  cursor: pointer;
  box-shadow: var(--shadow);
}
.invite-main {
  font-weight: 600;
  font-size: 0.95rem;
}
.invite-hint {
  font-size: 0.72rem;
  opacity: 0.92;
}

/* 2人状態のダッシュボード要約 */
.summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  cursor: pointer;
  font-size: 0.9rem;
  box-shadow: var(--shadow-sm);
}
.summary-main {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary-count {
  flex: 0 0 auto;
  font-weight: 700;
  color: var(--accent-ink);
}
.summary-main.muted,
.summary-count.muted {
  color: var(--text-muted);
  font-weight: 500;
}

/* セクション見出し */
.section-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: var(--space-6) 0 var(--space-3);
  letter-spacing: 0.04em;
}
.section-label .muted {
  color: var(--text-faint);
  font-size: 0.72rem;
}

/* 機能タイル */
.tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 84px;
  padding: var(--space-4);
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.tile.wide {
  grid-column: 1 / -1;
}
/* 共有＝塗りの面、個人＝破線＝「相手に出さない」を見た目で区別 */
.tile.shared {
  background: var(--surface-sub);
  border: 1px solid var(--border);
}
.tile.personal {
  background: var(--surface);
  border: 1px dashed var(--border-strong);
}
.tile .ico {
  font-size: 1.4rem;
  line-height: 1;
}
.tile-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.muted {
  color: var(--text-muted);
}
</style>
